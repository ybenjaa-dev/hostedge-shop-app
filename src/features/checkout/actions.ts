"use server";
import { cookies, headers } from "next/headers";
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
import { deviceClass, parseLines, sourceLabel } from "@/features/abandoned/lib";

export async function placeOrder(payload: unknown): Promise<CreateOrderResult> {
  try {
    return await createOrder(payload, { ip: await clientIp(), ua: (await headers()).get("user-agent"), vid: (await cookies()).get("he_vid")?.value ?? null });
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
  address: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
  productId: z.string().max(40).optional(),
  productName: z.string().max(200).optional(),
  lines: z
    .array(z.object({
      productId: z.string().min(1).max(40),
      variantId: z.string().max(40).nullish(),
      name: z.string().max(200),
      variantName: z.string().max(120).nullish(),
      qty: z.number().int().min(1).max(99),
      unitPrice: z.number().int().min(0).max(1e10),
    }))
    .max(30)
    .optional(),
  subtotal: z.number().int().min(0).max(1e11).optional(),
  total: z.number().int().min(0).max(1e11).optional(),
  currency: z.string().max(8).optional(),
  coupon: z.string().max(40).optional(),
  lang: z.string().max(5).optional(),
  page: z.object({
    url: z.string().max(500).optional(),
    referrer: z.string().max(500).optional(),
    utm: z.record(z.string().max(40), z.string().max(120)).optional(),
    fbclid: z.boolean().optional(),
    ttclid: z.boolean().optional(),
  }).optional(),
});

/** Saves a partially filled order form so the seller can follow up on WhatsApp. Rows are never deleted: re-saves only refresh the details. */
export async function saveAbandoned(input: unknown) {
  const p = abandonedSchema.safeParse(input);
  if (!p.success) return;
  const d = p.data;
  const ph = normalizePhone(d.phone, d.phoneCountry);
  if (!ph.ok) return;
  await ensureSchema();
  const ip = await clientIp();
  if (!(await rateLimit(`aband:${ip}`, 40, 3600)).ok) return;
  const now = Date.now();
  const lines = d.lines?.length ? JSON.stringify(parseLines(d.lines)) : null;
  const device = deviceClass((await headers()).get("user-agent"));
  const pg = d.page;
  const source = pg ? sourceLabel({ utmSource: pg.utm?.utm_source, fbclid: pg.fbclid, ttclid: pg.ttclid, referrer: pg.referrer }) : null;
  const extra = JSON.stringify({ country: ph.country, url: pg?.url, referrer: pg?.referrer, utm: pg?.utm, customerNotes: d.notes });
  await getEnv()
    .DB.prepare(
      `INSERT INTO abandoned_orders (id, phone, name, city, address, product_id, product_name, lines, subtotal, total, currency, coupon, lang, source, device, extra, status, recovered, contacted_count, saves, last_seen_at, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'new', 0, 0, 1, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET phone = excluded.phone, name = COALESCE(excluded.name, name), city = COALESCE(excluded.city, city), address = COALESCE(excluded.address, address),
         product_id = COALESCE(excluded.product_id, product_id), product_name = COALESCE(excluded.product_name, product_name), lines = COALESCE(excluded.lines, lines),
         subtotal = COALESCE(excluded.subtotal, subtotal), total = COALESCE(excluded.total, total), currency = COALESCE(excluded.currency, currency), coupon = excluded.coupon,
         lang = COALESCE(excluded.lang, lang), source = COALESCE(source, excluded.source), device = COALESCE(device, excluded.device), extra = excluded.extra,
         saves = saves + 1, last_seen_at = excluded.last_seen_at, updated_at = excluded.updated_at`,
    )
    .bind(d.id, ph.e164, d.name ?? null, d.city ?? null, d.address ?? null, d.productId ?? null, d.productName ?? null, lines, d.subtotal ?? null, d.total ?? null, d.currency ?? null, d.coupon ?? null, d.lang ?? null, source, device, extra, now, now, now)
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
