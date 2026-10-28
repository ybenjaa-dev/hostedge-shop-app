"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { fail } from "@/features/settings/lib";
import { getSettings } from "@/lib/settings";
import { toMinor } from "@/lib/money";
import { createOrder, type CreateOrderResult } from "@/features/orders/service";
import { canTransition, isAbandonedStatus, recoveredFlag, restoreTarget, parseLines, type AbandonedStatus } from "./lib";

type Row = { id: string; status: string; contacted_count: number; phone: string | null };
async function getRow(id: string): Promise<Row | null> {
  await ensureSchema();
  return getEnv().DB.prepare("SELECT id, status, contacted_count, phone FROM abandoned_orders WHERE id = ?").bind(id).first<Row>();
}
const bump = (id?: string) => { revalidatePath("/admin/abandoned"); if (id) revalidatePath(`/admin/abandoned/${id}`); };

async function setStatus(id: string, to: AbandonedStatus, userArgs: Parameters<typeof audit>[0], action: string): Promise<ActionState> {
  const row = await getRow(id);
  if (!row) return fail("Record not found");
  const from = row.status as AbandonedStatus;
  if (!canTransition(from, to)) return fail(`Can't move a ${from} checkout to ${to}.`);
  await getEnv().DB.prepare("UPDATE abandoned_orders SET status = ?, recovered = ? WHERE id = ?").bind(to, recoveredFlag(to), id).run();
  await audit(userArgs, action, "abandoned", id, { from, to });
  bump(id);
  return undefined;
}

export async function dismissAbandoned(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("abandoned.view", async (user) => {
    const id = fd(form, "id");
    return (await setStatus(id, "dismissed", user, "abandoned.dismiss")) ?? { message: "Dismissed — you can restore it any time" };
  });
}

export async function restoreAbandoned(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("abandoned.view", async (user) => {
    const id = fd(form, "id");
    const row = await getRow(id);
    if (!row) return fail("Record not found");
    return (await setStatus(id, restoreTarget(row.contacted_count), user, "abandoned.restore")) ?? { message: "Restored" };
  });
}

export async function setAbandonedStatus(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("abandoned.view", async (user) => {
    const to = fd(form, "status");
    if (!isAbandonedStatus(to) || to === "converted") return fail("Invalid status");
    return (await setStatus(fd(form, "id"), to, user, "abandoned.status")) ?? { message: "Status updated" };
  });
}

export async function saveAbandonedNote(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("abandoned.view", async (user) => {
    const id = fd(form, "id");
    const note = fd(form, "note").slice(0, 2000);
    if (!(await getRow(id))) return fail("Record not found");
    await getEnv().DB.prepare("UPDATE abandoned_orders SET note = ? WHERE id = ?").bind(note || null, id).run();
    await audit(user, "abandoned.note", "abandoned", id);
    bump(id);
    return { message: "Note saved" };
  });
}

/** Called when staff click WhatsApp: records the follow-up (status -> contacted, timestamp, counter). The link itself is opened by the client. */
export async function recordContact(id: string): Promise<{ ok: boolean }> {
  const res = await run("abandoned.view", async (user) => {
    const row = await getRow(id);
    if (!row) return fail("Record not found");
    const next: AbandonedStatus = row.status === "converted" ? "converted" : "contacted";
    await getEnv().DB.prepare("UPDATE abandoned_orders SET status = ?, recovered = ?, contacted_at = ?, contacted_count = contacted_count + 1 WHERE id = ?").bind(next, recoveredFlag(next), Date.now(), id).run();
    await audit(user, "abandoned.contact", "abandoned", id, { channel: "whatsapp" });
    bump(id);
  });
  return { ok: !res?.error };
}

const convertSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Enter the customer name").max(80),
  phone: z.string().trim().min(6, "Enter a phone number").max(24),
  cityId: z.string().max(40).optional(),
  cityText: z.string().trim().max(80).optional(),
  address: z.string().trim().min(4, "Enter the delivery address").max(300),
  notes: z.string().trim().max(500).optional(),
  coupon: z.string().trim().max(40).optional(),
  shippingFee: z.string().trim().max(14).optional(),
});

const ERRORS: Record<string, string> = {
  stock: "One of the products is out of stock (or the quantity exceeds the stock).",
  unavailable: "A product in the cart is unavailable or its variant is missing.",
  phone: "The phone number is not valid for this store's country. Include the country code.",
  blocked: "This phone number is blocked.",
  city: "That city isn't available.",
  cod_unavailable: "Cash on delivery isn't available for this city.",
  validation: "Please check the form fields.",
};

export async function convertAbandoned(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("orders.confirm", async (user) => {
    const parsed = convertSchema.safeParse({
      id: fd(form, "id"), name: fd(form, "name"), phone: fd(form, "phone"), cityId: fd(form, "cityId") || undefined, cityText: fd(form, "cityText") || undefined,
      address: fd(form, "address"), notes: fd(form, "notes") || undefined, coupon: fd(form, "coupon") || undefined, shippingFee: fd(form, "shippingFee") || undefined,
    });
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
    const d = parsed.data;
    const row = await getRow(d.id);
    if (!row) return fail("Record not found");
    if (row.status === "converted") return fail("This checkout was already converted to an order.");
    let raw: unknown;
    try { raw = JSON.parse(fd(form, "lines") || "[]"); } catch { raw = []; }
    const lines = parseLines(raw);
    if (!lines.length) return fail("Add at least one product.");
    if (!d.cityId && !d.cityText) return fail("Choose the delivery city.");
    const s = await getSettings();
    let shippingFee: number | undefined;
    if (d.shippingFee) {
      shippingFee = toMinor(d.shippingFee, s.store.currency);
      if (!Number.isFinite(shippingFee) || shippingFee < 0) return fail("Enter a valid shipping fee.");
    }
    const res: CreateOrderResult = await createOrder(
      {
        idemKey: `aband-${d.id}`.slice(0, 64),
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
        name: d.name, phone: d.phone, phoneCountry: s.store.country, cityId: d.cityId || null, cityText: d.cityText, address: d.address,
        notes: d.notes, couponCode: d.coupon, source: "abandoned", lang: s.store.defaultLang,
      },
      { ip: "admin", admin: { id: user.id, name: user.name }, shippingFee },
    );
    if (!res.ok) {
      const f = res.fields && Object.keys(res.fields).length ? ` (${Object.keys(res.fields).join(", ")})` : "";
      return fail((ERRORS[res.code] ?? "Couldn't create the order. Please try again.") + (res.code === "validation" ? f : ""));
    }
    const o = await getEnv().DB.prepare("SELECT id FROM orders WHERE number = ?").bind(res.number).first<{ id: string }>();
    if (!o) return fail("Order created but could not be opened. Check the Orders page.");
    // createOrder already converts every checkout of this phone; make sure this exact row is linked too.
    await getEnv().DB.prepare("UPDATE abandoned_orders SET status = 'converted', recovered = 1, converted_order_id = ? WHERE id = ?").bind(o.id, d.id).run();
    await audit(user, "abandoned.convert", "abandoned", d.id, { order: res.number });
    bump(d.id);
    revalidatePath("/admin/orders");
    redirect(`/admin/orders/${o.id}?converted=1`);
  });
}
