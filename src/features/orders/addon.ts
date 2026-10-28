import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings } from "@/lib/settings";
import { newId } from "@/lib/id";
import { companions, type Companion } from "@/features/catalog/links";
import { orderToken } from "./service";

export type AddonOrder = { id: string; number: string; status: string; total: number; currency: string; createdAt: number };
export type AddonOffer = { order: AddonOrder; items: (Companion & { offerPrice: number })[]; pct: number };

/** The discounted price of a companion for the one-click offer. */
export const addonPrice = (price: number, pct: number) => Math.max(0, Math.round(price * (1 - pct / 100)));

async function eligibleOrder(number: string, token: string): Promise<AddonOrder | null> {
  await ensureSchema();
  const db = getEnv().DB;
  const o = await db.prepare("SELECT id, number, status, total, currency, phone, created_at AS createdAt FROM orders WHERE number = ?").bind(number).first<AddonOrder & { phone: string }>();
  if (!o || !token || token !== (await orderToken(number, o.phone))) return null;
  const s = await getSettings();
  const u = s.offers.upsell;
  if (!u.enabled || !["new", "pending_confirmation"].includes(o.status)) return null;
  if (Date.now() - o.createdAt > u.windowMin * 60_000) return null;
  const already = await db.prepare("SELECT COUNT(*) AS n FROM order_items WHERE order_id = ? AND addon = 1").bind(o.id).first<{ n: number }>();
  if ((already?.n ?? 0) >= 2) return null;
  return { id: o.id, number: o.number, status: o.status, total: o.total, currency: o.currency, createdAt: o.createdAt };
}

/** What to offer: the add-on products linked to anything in the order that are not already in it. null = nothing to offer, go straight to the thank-you page. */
export async function getAddonOffer(number: string, token: string): Promise<AddonOffer | null> {
  const order = await eligibleOrder(number, token);
  if (!order) return null;
  const db = getEnv().DB;
  const inOrder = (await db.prepare("SELECT product_id AS id FROM order_items WHERE order_id = ?").bind(order.id).all<{ id: string }>()).results.map((r) => r.id).filter(Boolean);
  const pct = (await getSettings()).offers.upsell.discountPct;
  const seen = new Set<string>(inOrder);
  const items: AddonOffer["items"] = [];
  for (const pid of inOrder) {
    for (const c of await companions(pid, "addon", 3, [...seen])) {
      if (seen.has(c.id) || items.length >= 2) continue;
      seen.add(c.id);
      items.push({ ...c, offerPrice: addonPrice(c.price, pct) });
    }
  }
  return items.length ? { order, items, pct } : null;
}

export type AddonResult = { ok: true; total: number; currency: string; freeShipping: boolean } | { ok: false; reason: "gone" | "stock" };

/** Append the product to the order (unit price = discounted), recompute the totals like checkout does, and leave a history note. */
export async function applyAddon(number: string, token: string, productId: string): Promise<AddonResult> {
  const offer = await getAddonOffer(number, token);
  const pick = offer?.items.find((i) => i.id === productId);
  if (!offer || !pick) return { ok: false, reason: "gone" };
  const db = getEnv().DB;
  const s = await getSettings();
  const o = await db.prepare("SELECT subtotal, shipping, discount, cod_fee AS codFee, tax, total FROM orders WHERE id = ?").bind(offer.order.id).first<{ subtotal: number; shipping: number; discount: number; codFee: number; tax: number; total: number }>();
  if (!o) return { ok: false, reason: "gone" };
  const fresh = pick;
  const price = addonPrice(fresh.price, offer.pct);
  const subtotal = o.subtotal + price;
  const net = subtotal - o.discount;
  const thr = s.checkout.freeShippingThreshold;
  const freeNow = thr > 0 && net >= thr && o.shipping > 0;
  const shipping = freeNow ? 0 : o.shipping;
  const rate = s.store.taxRateBp;
  const tax = rate > 0 ? (s.store.taxInclusive ? Math.round((net * rate) / (10000 + rate)) : Math.round((net * rate) / 10000)) : 0;
  const total = net + shipping + o.codFee + (s.store.taxInclusive ? 0 : tax);
  const now = Date.now();
  await db.batch([
    db.prepare("INSERT INTO order_items (id, order_id, product_id, variant_id, name, variant_name, sku, price, qty, image, addon) VALUES (?,?,?,?,?,?,?,?,1,?,1)").bind(newId(), offer.order.id, fresh.id, fresh.variantId, JSON.stringify(fresh.name), fresh.variantName, null, price, fresh.image),
    db.prepare("UPDATE orders SET subtotal = ?, shipping = ?, tax = ?, total = ?, updated_at = ? WHERE id = ?").bind(subtotal, shipping, tax, total, now, offer.order.id),
    db.prepare("INSERT INTO order_history (id, order_id, from_status, to_status, user_name, note, created_at) VALUES (?,?,?,?,?,?,?)").bind(newId(), offer.order.id, offer.order.status, offer.order.status, "customer", `Added with one tap after checkout: ${fresh.variantName ? `${fresh.variantName} ` : ""}(${offer.pct}% off)${freeNow ? " — unlocked free delivery" : ""}`, now),
  ]);
  return { ok: true, total, currency: offer.order.currency, freeShipping: freeNow };
}
