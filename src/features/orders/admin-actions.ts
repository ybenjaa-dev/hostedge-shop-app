"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { newId } from "@/lib/id";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { changeOrderStatus } from "./service";
import { ORDER_STATUSES } from "@/lib/order-status";

const statusSchema = z.enum(ORDER_STATUSES);

export async function updateStatusAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = z.string().min(1).parse(fd(form, "id"));
    const to = statusSchema.parse(fd(form, "status"));
    const note = fd(form, "note").slice(0, 500) || undefined;
    const until = fd(form, "postponeUntil");
    const postponeUntil = until ? Date.parse(until) : null;
    if (to === "postponed" && (!postponeUntil || Number.isNaN(postponeUntil))) return { ok: false, error: "Choose a date to postpone to." };
    const r = await changeOrderStatus(id, to, { id: user.id, name: user.name }, { note, postponeUntil });
    if (!r.ok) return { ok: false, error: r.error };
    await audit(user, "order.status", "order", id, { to });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    return { message: "Status updated" };
  });
}

export async function bulkStatusAction(ids: string[], to: string): Promise<{ ok: boolean; done: number; failed: { id: string; error: string }[]; error?: string }> {
  const res = await run("staff", async (user) => {
    const status = statusSchema.parse(to);
    const list = z.array(z.string().min(1)).min(1).max(200).parse(ids);
    let done = 0;
    const failed: { id: string; error: string }[] = [];
    for (const id of list) {
      const r = await changeOrderStatus(id, status, { id: user.id, name: user.name });
      if (r.ok) done++; else failed.push({ id, error: r.error });
    }
    await audit(user, "order.bulk_status", "order", undefined, { to: status, count: done });
    revalidatePath("/admin/orders");
    return { message: `${done} updated`, id: JSON.stringify({ done, failed }) };
  });
  if (res?.error) return { ok: false, done: 0, failed: [], error: res.error };
  const parsed = JSON.parse(res?.id ?? "{}") as { done: number; failed: { id: string; error: string }[] };
  return { ok: true, done: parsed.done, failed: parsed.failed };
}

export async function addNoteAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = z.string().min(1).parse(fd(form, "id"));
    const body = z.string().trim().min(1).max(1000).parse(fd(form, "body"));
    await getEnv().DB.prepare("INSERT INTO order_notes (id, order_id, user_name, body, created_at) VALUES (?,?,?,?,?)").bind(newId(), id, user.name, body, Date.now()).run();
    revalidatePath(`/admin/orders/${id}`);
    return { message: "Note added" };
  });
}

const editSchema = z.object({ id: z.string().min(1), name: z.string().trim().min(2).max(80), address: z.string().trim().min(3).max(300), city: z.string().trim().min(1).max(80), notes: z.string().trim().max(500).optional() });
export async function editOrderAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const d = editSchema.parse({ id: fd(form, "id"), name: fd(form, "name"), address: fd(form, "address"), city: fd(form, "city"), notes: fd(form, "notes") || undefined });
    await getEnv().DB.prepare("UPDATE orders SET name = ?, address = ?, city = ?, notes = ?, updated_at = ? WHERE id = ?").bind(d.name, d.address, d.city, d.notes ?? null, Date.now(), d.id).run();
    await audit(user, "order.edit", "order", d.id);
    revalidatePath(`/admin/orders/${d.id}`);
    return { message: "Order updated" };
  });
}

export async function blockPhoneAction(phone: string, reason: string): Promise<ActionState> {
  return run("staff", async (user) => {
    const p = z.string().regex(/^\d{6,15}$/).parse(phone);
    await getEnv().DB.prepare("INSERT OR REPLACE INTO blocked_phones (phone, reason, created_at) VALUES (?,?,?)").bind(p, reason.slice(0, 200) || null, Date.now()).run();
    await audit(user, "phone.block", "customer", p);
    revalidatePath("/admin/orders");
    return { message: "Phone blocked" };
  });
}
export async function unblockPhoneAction(phone: string): Promise<ActionState> {
  return run("staff", async (user) => {
    await getEnv().DB.prepare("DELETE FROM blocked_phones WHERE phone = ?").bind(z.string().regex(/^\d{6,15}$/).parse(phone)).run();
    await audit(user, "phone.unblock", "customer", phone);
    revalidatePath("/admin/orders");
    return { message: "Phone unblocked" };
  });
}

export async function markRemittedAction(ids: string[], remitted: boolean): Promise<ActionState> {
  return run("staff", async (user) => {
    const list = z.array(z.string().min(1)).min(1).max(500).parse(ids);
    const db = getEnv().DB;
    await db.batch(list.map((id) => db.prepare("UPDATE orders SET remitted = ?, updated_at = ? WHERE id = ? AND status = 'delivered'").bind(remitted ? 1 : 0, Date.now(), id)));
    await audit(user, "cash.remitted", "order", undefined, { count: list.length, remitted });
    revalidatePath("/admin/cash");
    return { message: remitted ? "Marked as remitted" : "Marked as pending" };
  });
}

export async function setCarrierFeeAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = z.string().min(1).parse(fd(form, "id"));
    const { getSettings } = await import("@/lib/settings");
    const { toMinor } = await import("@/lib/money");
    const fee = toMinor(fd(form, "fee") || "0", (await getSettings()).store.currency);
    if (!Number.isFinite(fee) || fee < 0) return { ok: false, error: "Enter a valid amount." };
    await getEnv().DB.prepare("UPDATE orders SET carrier_fee = ?, updated_at = ? WHERE id = ?").bind(fee, Date.now(), id).run();
    await audit(user, "order.carrier_fee", "order", id);
    revalidatePath(`/admin/orders/${id}`);
    return { message: "Saved" };
  });
}
