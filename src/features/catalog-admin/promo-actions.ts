"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { getSettings, saveSettings } from "@/lib/settings";
import { isOfferTemplate } from "@/lib/offer-templates";
import { toMinor } from "@/lib/money";
import { newId } from "@/lib/id";
import { parse, refresh, fail } from "@/features/settings/lib";

function dayMs(v: string, end: boolean): number | null | undefined {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const t = Date.parse(`${v}T${end ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(t) ? undefined : t;
}

export async function saveCoupon(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const cur = (await getSettings()).store.currency;
    const p = parse(
      z.object({
        id: z.string().max(40),
        code: z.string().regex(/^[A-Z0-9_-]{3,30}$/, "Code: 3–30 letters, numbers, - or _"),
        type: z.enum(["percent", "fixed", "free_shipping"]),
      }),
      { id: fd(form, "id"), code: fd(form, "code").toUpperCase(), type: fd(form, "type") },
    );
    if (!p.ok) return p.state;
    const d = p.data;
    let value = 0;
    if (d.type === "percent") {
      value = Number(fd(form, "value"));
      if (!Number.isInteger(value) || value < 1 || value > 100) return fail("Percent must be a whole number from 1 to 100");
    } else if (d.type === "fixed") {
      value = toMinor(fd(form, "value"), cur);
      if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000) return fail("Enter a valid discount amount");
    }
    const minSubtotal = toMinor(fd(form, "minSubtotal") || "0", cur);
    if (!Number.isFinite(minSubtotal) || minSubtotal < 0) return fail("Minimum subtotal must be a valid amount");
    const maxRaw = fd(form, "maxUses");
    const maxUses = maxRaw === "" ? null : Number(maxRaw);
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 10_000_000)) return fail("Max uses must be a positive whole number (or empty)");
    const startsAt = dayMs(fd(form, "startsAt"), false), endsAt = dayMs(fd(form, "endsAt"), true);
    if (startsAt === undefined || endsAt === undefined) return fail("Invalid date");
    if (startsAt && endsAt && endsAt < startsAt) return fail("End date must be after the start date");
    const values = { code: d.code, type: d.type, value, minSubtotal, maxUses, startsAt, endsAt, active: form.get("active") === "1" };
    const db = getDb();
    if (d.id) {
      await db.update(schema.coupons).set(values).where(eq(schema.coupons.id, d.id));
      await audit(user, "coupon.update", "coupon", d.id);
    } else {
      const id = newId();
      await db.insert(schema.coupons).values({ id, ...values });
      await audit(user, "coupon.create", "coupon", id);
    }
    refresh();
    return { message: d.id ? "Coupon saved" : "Coupon created" };
  });
}

export async function deleteCoupon(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing coupon");
    await getDb().delete(schema.coupons).where(eq(schema.coupons.id, id));
    await audit(user, "coupon.delete", "coupon", id);
    refresh();
    return { message: "Coupon deleted" };
  });
}

export async function saveBundle(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const p = parse(
      z.object({
        id: z.string().max(40),
        productId: z.string().max(40),
        minQty: z.number().int().min(2, "Quantity must be at least 2").max(1000),
        percent: z.number().int().min(1, "Discount must be 1–90%").max(90, "Discount must be 1–90%"),
        image: z.string().regex(/^(uploads\/[A-Za-z0-9._-]{4,120})?$/, "Invalid image"),
      }),
      { id: fd(form, "id"), productId: fd(form, "productId"), minQty: Number(fd(form, "minQty")), percent: Number(fd(form, "percent")), image: fd(form, "image") },
    );
    if (!p.ok) return p.state;
    const d = p.data;
    if (d.productId) {
      const pr = await getDb().select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.id, d.productId)).get();
      if (!pr) return fail("Product not found");
    }
    const values = { productId: d.productId || null, minQty: d.minQty, percent: d.percent, image: d.image || null, active: form.get("active") === "1" };
    const db = getDb();
    if (d.id) {
      await db.update(schema.bundles).set(values).where(eq(schema.bundles.id, d.id));
      await audit(user, "bundle.update", "bundle", d.id);
    } else {
      const id = newId();
      await db.insert(schema.bundles).values({ id, ...values });
      await audit(user, "bundle.create", "bundle", id);
    }
    refresh();
    return { message: d.id ? "Bundle saved" : "Bundle created" };
  });
}

export async function saveOfferTemplate(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const t = fd(form, "template");
    if (!isOfferTemplate(t)) return { ok: false, error: "Choose a layout." };
    await saveSettings("offers", { template: t });
    await audit(user, "offers.template", "settings", t);
    refresh();
    return { message: "Offer card layout saved for all products" };
  });
}

export async function deleteBundle(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing bundle");
    await getDb().delete(schema.bundles).where(eq(schema.bundles.id, id));
    await audit(user, "bundle.delete", "bundle", id);
    refresh();
    return { message: "Bundle deleted" };
  });
}
