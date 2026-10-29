import "server-only";
import { headers } from "next/headers";
import { findBlock, linkOrderToVisitor } from "@/features/visitors/server";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { browserEvent } from "@/features/tracking/capi-core";
import { getSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/phone";
import { newId } from "@/lib/id";
import { rateLimit } from "@/lib/ratelimit";
import { buildQuote } from "./pricing-service";
import { orderInputSchema } from "./schema";
import { canTransition, isStatus, stockAction, type OrderStatus } from "@/lib/order-status";

export type CreateOrderResult =
  | { ok: true; orderId: string; number: string; token: string; total: number; currency: string; duplicate?: boolean; pixelEvent?: "Purchase" | "Lead"; items: { productId: string; name: string; qty: number; price: number }[]; status: string }
  | { ok: false; code: "validation" | "phone" | "blocked" | "rate_limit" | "stock" | "unavailable" | "cod_unavailable" | "city" | "error"; message?: string; fields?: Record<string, string> };

async function nextOrderNumber(): Promise<string> {
  const r = await getEnv()
    .DB.prepare(
      `INSERT INTO settings (key, value) VALUES ('order_seq', '1001')
       ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)
       RETURNING value`,
    )
    .first<{ value: string }>();
  return r?.value ?? String(Date.now());
}

/** Public tracking token = HMAC-less short code stored with the order id; lets confirmation page load the order. */
export async function createOrder(raw: unknown, ctx: { ip: string; ua?: string | null; vid?: string | null; admin?: { id: string; name: string }; shippingFee?: number }): Promise<CreateOrderResult> {
  const T0 = Date.now(); const lap = (n: string) => console.log(`[t] createOrder ${n} +${Date.now() - T0}ms`);
  await ensureSchema(); lap("schema");
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0] ?? "form")] = i.message;
    return { ok: false, code: "validation", fields };
  }
  const input = parsed.data;
  const s = await getSettings(); lap("settings");

  // Honeypot: pretend success so bots learn nothing.
  if (input.hp && !ctx.admin) return { ok: true, orderId: "", number: "0000", token: "x", total: 0, currency: s.store.currency, items: [], status: "new" };

  const ph = normalizePhone(input.phone, input.phoneCountry);
  if (!ph.ok) return { ok: false, code: "phone", fields: { phone: "invalid" } };

  const db = getEnv().DB;

  // Idempotency: the same key always returns the same order.
  const [existingByKey, blocked, existingCustomer] = await Promise.all([
    db.prepare("SELECT id, number, total, currency, status FROM orders WHERE idem_key = ?").bind(input.idemKey).first<{ id: string; number: string; total: number; currency: string; status: string }>(),
    db.prepare("SELECT phone FROM blocked_phones WHERE phone = ?").bind(ph.e164).first(),
    db.prepare("SELECT id FROM customers WHERE phone = ?").bind(ph.e164).first<{ id: string }>(),
  ]);
  lap("reads1");
  if (existingByKey) return await existingResult(existingByKey, true);

  // Staff-entered orders (admin context) skip the customer-facing throttles and the duplicate window.
  if (!ctx.admin) {
    const [ipRl, phoneRl] = await Promise.all([
      rateLimit(`order:ip:${ctx.ip}`, s.checkout.ratePerHourPerIp, 3600),
      rateLimit(`order:ph:${ph.e164}`, s.checkout.ratePerDayPerPhone, 86400),
    ]);
    if (!ipRl.ok || !phoneRl.ok) return { ok: false, code: "rate_limit" };
  }

  if (blocked) return { ok: false, code: "blocked" };
  const reqHeaders = await headers().catch(() => null); // null outside a request (cron, scripts)
  const [signal, quote] = await Promise.all([
    reqHeaders ? findBlock(reqHeaders, { fp: input.tracking?.fp, phone: ph.e164 }) : null,
    buildQuote({ items: input.items, cityId: input.cityId, couponCode: input.couponCode }, ctx.shippingFee != null ? { shippingFee: ctx.shippingFee } : {}),
  ]);
  lap("block+quote");
  if (signal) return { ok: false, code: "blocked" };
  if (quote.errors.some((e) => e.reason === "stock")) return { ok: false, code: "stock" };
  if (quote.errors.length || !quote.lines.length) return { ok: false, code: "unavailable" };
  if (input.cityId && !quote.city) return { ok: false, code: "city" };
  if (quote.city && !quote.city.codAvailable) return { ok: false, code: "cod_unavailable" };
  const cityName = quote.city?.name ?? input.cityText?.trim();
  if (!cityName) return { ok: false, code: "validation", fields: { city: "required" } };

  // Duplicate detection: same phone + any same product inside the window.
  const windowMs = ctx.admin ? 0 : s.checkout.duplicateWindowMin * 60_000;
  if (windowMs > 0) {
    const ids = quote.lines.map((l) => l.productId);
    const dup = await db
      .prepare(
        `SELECT o.id, o.number, o.total, o.currency, o.status FROM orders o
         WHERE o.phone = ? AND o.created_at > ? AND o.status NOT IN ('cancelled')
           AND EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.product_id IN (${ids.map(() => "?").join(",")}))
         ORDER BY o.created_at DESC LIMIT 1`,
      )
      .bind(ph.e164, Date.now() - windowMs, ...ids)
      .first<{ id: string; number: string; total: number; currency: string; status: string }>();
    if (dup) return await existingResult(dup, true);
  }

  const id = newId();
  const number = await nextOrderNumber(); lap("number");
  const now = Date.now();
  const status: OrderStatus = s.checkout.confirmationStep ? "pending_confirmation" : "new";
  const t = quote.totals;

  const customerId = existingCustomer?.id ?? newId();

  const stmts = [
    db
      .prepare(
        `INSERT INTO orders (id, number, idem_key, status, customer_id, name, phone, country, city_id, city, address, notes, currency, subtotal, shipping, discount, cod_fee, tax, total, coupon_code, payment_method, ip, source, lang, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .bind(id, number, input.idemKey, status, customerId, input.name, ph.e164, ph.country, quote.city?.id ?? null, cityName, input.address, input.notes ?? null, s.store.currency, t.subtotal, t.shipping, t.discount, t.codFee, t.tax, t.total, quote.coupon?.code ?? null, "cod", ctx.ip, input.source ?? null, input.lang ?? null, now, now),
    ...quote.lines.map((l, i) =>
      db
        .prepare("INSERT INTO order_items (id, order_id, product_id, variant_id, name, variant_name, sku, price, qty, image) VALUES (?,?,?,?,?,?,?,?,?,?)")
        // price stored net of bundle discount per unit isn't integer-safe; keep unit price, discount lives on the order.
        .bind(newId(), id, l.productId, l.variantId, l.name, l.variantName, l.sku, l.unitPrice, l.qty, l.image),
    ),
    db.prepare("INSERT INTO order_history (id, order_id, from_status, to_status, user_name, note, created_at) VALUES (?,?,?,?,?,?,?)").bind(newId(), id, null, status, ctx.admin?.name ?? "customer", null, now),
    existingCustomer
      ? db.prepare("UPDATE customers SET name = ?, orders_count = orders_count + 1, last_order_at = ? WHERE id = ?").bind(input.name, now, customerId)
      : db.prepare("INSERT INTO customers (id, phone, name, orders_count, last_order_at, created_at) VALUES (?,?,?,1,?,?)").bind(customerId, ph.e164, input.name, now, now),
    // A real order from this phone converts its abandoned checkouts (rows are kept and linked, never hidden).
    db.prepare("UPDATE abandoned_orders SET status = 'converted', recovered = 1, converted_order_id = ? WHERE phone = ? AND status != 'converted'").bind(id, ph.e164),
  ];
  if (quote.coupon) stmts.push(db.prepare("UPDATE coupons SET used = used + 1 WHERE code = ?").bind(quote.coupon.code));
  stmts.push(db.prepare("UPDATE orders SET tracking = ? WHERE id = ?").bind(JSON.stringify({ ...(input.tracking ?? {}), ua: (ctx.ua ?? "").slice(0, 300) }), id));

  try {
    await db.batch(stmts); lap("batch");
  } catch (e) {
    // Unique idem_key race: a parallel request created it first.
    const again = await db.prepare("SELECT id, number, total, currency, status FROM orders WHERE idem_key = ?").bind(input.idemKey).first<{ id: string; number: string; total: number; currency: string; status: string }>();
    if (again) return await existingResult(again, true);
    console.error("order insert failed", e);
    return { ok: false, code: "error" };
  }

  await linkOrderToVisitor(ctx.vid ?? null, id, ph.e164).catch(() => {}); lap("link");
  // server-side ad events (Meta / TikTok Conversions API) — in the background, never blocks or breaks the order
  void import("@/features/tracking/capi").then((m) => m.dispatchInBackground(id, "placed")).catch(() => {});
  return {
    ok: true,
    orderId: id,
    number,
    pixelEvent: browserEvent(s.analytics.capi.purchaseWhen),
    token: await orderToken(number, ph.e164),
    total: t.total,
    currency: s.store.currency,
    status,
    items: quote.lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, price: l.unitPrice })),
  };
}

async function existingResult(o: { id: string; number: string; total: number; currency: string; status: string }, duplicate: boolean): Promise<CreateOrderResult> {
  const db = getEnv().DB;
  const [items, ord] = await Promise.all([
    db.prepare("SELECT product_id AS productId, name, qty, price FROM order_items WHERE order_id = ?").bind(o.id).all<{ productId: string; name: string; qty: number; price: number }>(),
    db.prepare("SELECT phone FROM orders WHERE id = ?").bind(o.id).first<{ phone: string }>(),
  ]);
  return { ok: true, orderId: o.id, number: o.number, token: await orderToken(o.number, ord?.phone ?? ""), total: o.total, currency: o.currency, duplicate, items: items.results, status: o.status };
}

/** Signed token so the confirmation page can show an order without exposing PII by guessing numbers. */
export async function orderToken(number: string, phone: string): Promise<string> {
  const { sha256Hex } = await import("@/lib/crypto");
  const secret = await getInstallSecret();
  return (await sha256Hex(`${secret}:${number}:${phone}`)).slice(0, 24);
}

export async function getInstallSecret(): Promise<string> {
  const env = getEnv();
  if (env.SECRETS_KEY) return env.SECRETS_KEY;
  const db = env.DB;
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'install_secret'").first<{ value: string }>();
  if (row) return row.value;
  const { randomToken } = await import("@/lib/crypto");
  const v = randomToken(32);
  await db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('install_secret', ?)").bind(v).run();
  const again = await db.prepare("SELECT value FROM settings WHERE key = 'install_secret'").first<{ value: string }>();
  return again?.value ?? v;
}

// ---------------------------------------------------------------- status changes & stock

export type Actor = { id: string; name: string } | null;
type OrderRow = { id: string; status: string; stock_reserved: number; total: number; customer_id: string | null; attempts: number; cash_collected: number; city_id: string | null };

/**
 * Atomically reserve stock for an order. A CHECK(stock >= 0) constraint makes the whole D1 batch fail
 * (and roll back) if any line would oversell, so concurrent confirms can never push stock below zero.
 */
export async function reserveStock(orderId: string): Promise<{ ok: true } | { ok: false; reason: "stock" }> {
  const db = getEnv().DB;
  const claim = await db.prepare("UPDATE orders SET stock_reserved = 1 WHERE id = ? AND stock_reserved = 0").bind(orderId).run();
  if (!claim.meta.changes) return { ok: true }; // already reserved (idempotent)
  const items = (await db.prepare("SELECT i.product_id, i.variant_id, i.qty, p.track_stock FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = ?").bind(orderId).all<{ product_id: string | null; variant_id: string | null; qty: number; track_stock: number | null }>()).results;
  const stmts = items.flatMap((i) => {
    if (!i.product_id) return [];
    const out = [db.prepare("UPDATE products SET sold_count = sold_count + ? WHERE id = ?").bind(i.qty, i.product_id)];
    if (i.track_stock === 0) return out;
    out.push(
      i.variant_id
        ? db.prepare("UPDATE product_variants SET stock = stock - ? WHERE id = ?").bind(i.qty, i.variant_id)
        : db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").bind(i.qty, i.product_id),
    );
    return out;
  });
  try {
    if (stmts.length) await db.batch(stmts);
    return { ok: true };
  } catch {
    await db.prepare("UPDATE orders SET stock_reserved = 0 WHERE id = ?").bind(orderId).run();
    return { ok: false, reason: "stock" };
  }
}

export async function releaseStock(orderId: string) {
  const db = getEnv().DB;
  const claim = await db.prepare("UPDATE orders SET stock_reserved = 0 WHERE id = ? AND stock_reserved = 1").bind(orderId).run();
  if (!claim.meta.changes) return;
  const items = (await db.prepare("SELECT i.product_id, i.variant_id, i.qty, p.track_stock FROM order_items i LEFT JOIN products p ON p.id = i.product_id WHERE i.order_id = ?").bind(orderId).all<{ product_id: string | null; variant_id: string | null; qty: number; track_stock: number | null }>()).results;
  const stmts = items.flatMap((i) => {
    if (!i.product_id) return [];
    const out = [db.prepare("UPDATE products SET sold_count = MAX(0, sold_count - ?) WHERE id = ?").bind(i.qty, i.product_id)];
    if (i.track_stock === 0) return out;
    out.push(
      i.variant_id
        ? db.prepare("UPDATE product_variants SET stock = stock + ? WHERE id = ?").bind(i.qty, i.variant_id)
        : db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").bind(i.qty, i.product_id),
    );
    return out;
  });
  if (stmts.length) await db.batch(stmts);
}

export type StatusChangeResult = { ok: true; status: OrderStatus } | { ok: false; error: string };

export async function changeOrderStatus(
  orderId: string,
  to: string,
  actor: Actor,
  opts: { note?: string; postponeUntil?: number | null; force?: boolean } = {},
): Promise<StatusChangeResult> {
  if (!isStatus(to)) return { ok: false, error: "Unknown status" };
  const db = getEnv().DB;
  const o = await db.prepare("SELECT id, status, stock_reserved, total, customer_id, attempts, cash_collected, city_id FROM orders WHERE id = ?").bind(orderId).first<OrderRow>();
  if (!o) return { ok: false, error: "Order not found" };
  const from = o.status as OrderStatus;
  if (from === to && to !== "no_answer") return { ok: true, status: to };
  if (!opts.force && !canTransition(from, to)) return { ok: false, error: `Cannot move from "${from}" to "${to}"` };

  const action = stockAction(!!o.stock_reserved, to);
  if (action === "reserve") {
    const r = await reserveStock(orderId);
    if (!r.ok) return { ok: false, error: "Not enough stock to confirm this order." };
  } else if (action === "release") {
    await releaseStock(orderId);
  }

  const now = Date.now();
  const attempts = to === "no_answer" ? o.attempts + 1 : o.attempts;
  const collected = to === "delivered" ? o.total : to === "returned" || to === "refunded" ? 0 : o.cash_collected;
  const stmts = [
    db.prepare("UPDATE orders SET status = ?, attempts = ?, postpone_until = ?, cash_collected = ?, updated_at = ? WHERE id = ?").bind(to, attempts, to === "postponed" ? (opts.postponeUntil ?? null) : null, collected, now, orderId),
    db.prepare("INSERT INTO order_history (id, order_id, from_status, to_status, user_id, user_name, note, created_at) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), orderId, from, to, actor?.id ?? null, actor?.name ?? "system", opts.note ?? (to === "no_answer" ? `Attempt ${attempts}` : null), now),
  ];
  if (o.customer_id) {
    if (to === "delivered") stmts.push(db.prepare("UPDATE customers SET delivered_count = delivered_count + 1, total_spent = total_spent + ? WHERE id = ?").bind(o.total, o.customer_id));
    if (from === "delivered" && to !== "delivered") stmts.push(db.prepare("UPDATE customers SET delivered_count = MAX(0, delivered_count - 1), total_spent = MAX(0, total_spent - ?) WHERE id = ?").bind(o.total, o.customer_id));
    if (to === "returned") stmts.push(db.prepare("UPDATE customers SET returned_count = returned_count + 1 WHERE id = ?").bind(o.customer_id));
  }
  await db.batch(stmts);
  const kind = to === "confirmed" ? "confirmed" : to === "delivered" ? "delivered" : to === "returned" ? "returned" : null;
  if (kind) void import("@/features/tracking/capi").then((m) => m.dispatchInBackground(orderId, kind)).catch(() => {});
  return { ok: true, status: to };
}
