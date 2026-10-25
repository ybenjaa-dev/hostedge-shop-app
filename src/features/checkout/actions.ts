"use server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { createOrder, type CreateOrderResult } from "@/features/orders/service";
import { buildQuote } from "@/features/orders/pricing-service";
import { normalizePhone } from "@/lib/phone";
import { newId } from "@/lib/id";
import { getSettings } from "@/lib/settings";
import { quoteInputSchema } from "@/features/orders/schema";

export async function placeOrder(payload: unknown): Promise<CreateOrderResult> {
  try {
    return await createOrder(payload, { ip: await clientIp() });
  } catch (e) {
    console.error("placeOrder", e);
    return { ok: false, code: "error" };
  }
}

export type CouponResult = { ok: true; code: string; type: "percent" | "fixed" | "free_shipping"; value: number; minSubtotal: number } | { ok: false; reason: "invalid" | "expired" | "exhausted" | "rate" };

export async function validateCoupon(codeRaw: string): Promise<CouponResult> {
  await ensureSchema();
  const ip = await clientIp();
  if (!(await rateLimit(`coupon:${ip}`, 30, 600)).ok) return { ok: false, reason: "rate" };
  const code = z.string().trim().min(1).max(40).safeParse(codeRaw);
  if (!code.success) return { ok: false, reason: "invalid" };
  const row = await getEnv().DB.prepare("SELECT code, type, value, min_subtotal, max_uses, used, starts_at, ends_at FROM coupons WHERE code = ? AND active = 1").bind(code.data.toUpperCase()).first<Record<string, number | string | null>>();
  if (!row) return { ok: false, reason: "invalid" };
  const now = Date.now();
  if ((row.starts_at && (row.starts_at as number) > now) || (row.ends_at && (row.ends_at as number) < now)) return { ok: false, reason: "expired" };
  if (row.max_uses != null && (row.used as number) >= (row.max_uses as number)) return { ok: false, reason: "exhausted" };
  return { ok: true, code: row.code as string, type: row.type as "percent", value: row.value as number, minSubtotal: row.min_subtotal as number };
}

const abandonedSchema = z.object({
  id: z.string().min(8).max(40),
  phone: z.string().max(24),
  phoneCountry: z.string().length(2),
  name: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  productId: z.string().max(40).optional(),
  productName: z.string().max(200).optional(),
});

/** Saves a partially filled order form so the seller can follow up on WhatsApp. */
export async function saveAbandoned(input: unknown) {
  const p = abandonedSchema.safeParse(input);
  if (!p.success) return;
  const ph = normalizePhone(p.data.phone, p.data.phoneCountry);
  if (!ph.ok) return;
  await ensureSchema();
  const ip = await clientIp();
  if (!(await rateLimit(`aband:${ip}`, 40, 3600)).ok) return;
  const now = Date.now();
  await getEnv()
    .DB.prepare(
      `INSERT INTO abandoned_orders (id, phone, name, city, product_id, product_name, recovered, created_at, updated_at) VALUES (?,?,?,?,?,?,0,?,?)
       ON CONFLICT(id) DO UPDATE SET phone = excluded.phone, name = excluded.name, city = excluded.city, updated_at = excluded.updated_at`,
    )
    .bind(p.data.id, ph.e164, p.data.name ?? null, p.data.city ?? null, p.data.productId ?? null, p.data.productName ?? null, now, now)
    .run();
}

/** Re-prices a guest cart from the database so stale localStorage prices never reach checkout. */
export async function refreshCart(raw: unknown) {
  const p = quoteInputSchema.safeParse(raw);
  if (!p.success) return { ok: false as const };
  const q = await buildQuote(p.data);
  const s = await getSettings();
  return {
    ok: true as const,
    lines: q.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, variantName: l.variantName, price: l.unitPrice, image: l.image, qty: l.qty, available: l.available })),
    errors: q.errors,
    currency: s.store.currency,
  };
}

const reviewSchema = z.object({
  productId: z.string().min(1).max(40),
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(3).max(1000),
  hp: z.string().max(100).optional(),
});

export async function submitReview(raw: unknown): Promise<{ ok: boolean; pending?: boolean }> {
  const p = reviewSchema.safeParse(raw);
  if (!p.success) return { ok: false };
  if (p.data.hp) return { ok: true, pending: true };
  await ensureSchema();
  const ip = await clientIp();
  if (!(await rateLimit(`review:${ip}`, 5, 3600)).ok) return { ok: false };
  const s = await getSettings();
  const status = s.checkout.reviewsAutoApprove ? "approved" : "pending";
  await getEnv().DB.prepare("INSERT INTO reviews (id, product_id, name, rating, body, status, created_at) VALUES (?,?,?,?,?,?,?)").bind(newId(), p.data.productId, p.data.name, p.data.rating, p.data.body, status, Date.now()).run();
  return { ok: true, pending: status === "pending" };
}
