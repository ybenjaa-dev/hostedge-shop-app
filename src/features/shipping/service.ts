import "server-only";
import { getEnv } from "@/lib/env";
import { decimalsOf } from "@/lib/money";
import { rateLimit } from "@/lib/ratelimit";
import { changeOrderStatus, type Actor } from "@/features/orders/service";
import type { OrderStatus } from "@/lib/order-status";
import { getAdapter, ADAPTERS } from "./registry";
import { loadConfig, loadCredentials, getPublicCredentialState } from "./credentials";
import { buildCsv, csvFilename } from "./csv";
import { retryAsync } from "./http";
import type { ShipOrder, WebhookUpdate } from "./types";

export type SendResult = { orderId: string; ok: boolean; tracking?: string; error?: string };

type OrderDbRow = {
  id: string; number: string; status: string; name: string; phone: string; country: string; city_id: string | null; city: string; address: string; notes: string | null;
  currency: string; total: number; created_at: number; carrier_id: string | null; tracking_number: string | null; carrier_city_id: string | null;
};

export async function listCarriers(): Promise<{ id: string; name: string; hasApi: boolean; enabled: boolean; configured: boolean }[]> {
  const rows = (await getEnv().DB.prepare("SELECT id, enabled FROM carriers").all<{ id: string; enabled: number }>()).results;
  const enabled = new Map(rows.map((r) => [r.id, !!r.enabled]));
  return Promise.all(
    ADAPTERS.map(async (a) => ({ id: a.id, name: a.name, hasApi: a.hasApi, enabled: enabled.get(a.id) ?? false, configured: (await getPublicCredentialState(a.id)).configured })),
  );
}

async function isEnabled(carrierId: string): Promise<boolean> {
  const r = await getEnv().DB.prepare("SELECT enabled FROM carriers WHERE id = ?").bind(carrierId).first<{ enabled: number }>();
  return !!r?.enabled;
}

async function loadShipOrders(orderIds: string[], carrierId: string): Promise<{ order: ShipOrder; status: string; carrierId: string | null; tracking: string | null }[]> {
  if (!orderIds.length) return [];
  const db = getEnv().DB;
  const ph = orderIds.map(() => "?").join(",");
  const orders = (
    await db
      .prepare(
        `SELECT o.id, o.number, o.status, o.name, o.phone, o.country, o.city_id, o.city, o.address, o.notes, o.currency, o.total, o.created_at, o.carrier_id, o.tracking_number,
                cc.carrier_city_id AS carrier_city_id
         FROM orders o LEFT JOIN carrier_cities cc ON cc.city_id = o.city_id AND cc.carrier_id = ?
         WHERE o.id IN (${ph})`,
      )
      .bind(carrierId, ...orderIds)
      .all<OrderDbRow>()
  ).results;
  const items = (await db.prepare(`SELECT order_id, name, variant_name, sku, qty FROM order_items WHERE order_id IN (${ph})`).bind(...orderIds).all<{ order_id: string; name: string; variant_name: string | null; sku: string | null; qty: number }>()).results;
  const byOrder = new Map<string, ShipOrder["items"]>();
  for (const i of items) {
    const l = byOrder.get(i.order_id) ?? [];
    l.push({ name: i.name, variantName: i.variant_name, sku: i.sku, qty: i.qty });
    byOrder.set(i.order_id, l);
  }
  // keep caller's order
  const map = new Map(orders.map((o) => [o.id, o]));
  return orderIds.flatMap((id) => {
    const o = map.get(id);
    if (!o) return [];
    return [{
      status: o.status, carrierId: o.carrier_id, tracking: o.tracking_number,
      order: { id: o.id, number: o.number, name: o.name, phone: o.phone, country: o.country, city: o.city, cityId: o.city_id, carrierCityId: o.carrier_city_id, address: o.address, notes: o.notes, currency: o.currency, decimals: decimalsOf(o.currency), codAmount: o.total, items: byOrder.get(o.id) ?? [], createdAt: o.created_at },
    }];
  });
}

async function setShipmentError(orderId: string, msg: string) {
  await getEnv().DB.prepare("UPDATE orders SET shipment_error = ?, updated_at = ? WHERE id = ?").bind(msg.slice(0, 500), Date.now(), orderId).run();
}

async function storeLabel(number: string, pdf: ArrayBuffer | undefined, url: string | undefined): Promise<string | null> {
  try {
    let data = pdf;
    if (!data && url && /^https:\/\//.test(url)) {
      const r = await fetch(url);
      if (r.ok) data = await r.arrayBuffer();
    }
    if (!data) return null;
    const key = `labels/${number.replace(/[^\w-]/g, "")}.pdf`;
    await getEnv().FILES.put(key, data, { httpMetadata: { contentType: "application/pdf", cacheControl: "private, no-store" } });
    return key;
  } catch (e) {
    console.error("label store failed", e);
    return null;
  }
}

/**
 * Create shipments at the carrier's API for ready_to_ship orders. Never alters an order except on success
 * (carrier/tracking/label + status) or, on failure, its `shipment_error` text.
 */
export async function sendOrdersToCarrier(orderIds: string[], carrierId: string, actor: Actor): Promise<SendResult[]> {
  const adapter = getAdapter(carrierId);
  const ids = [...new Set(orderIds)].slice(0, 100);
  const fail = (error: string): SendResult[] => ids.map((orderId) => ({ orderId, ok: false, error }));
  if (!adapter) return fail("Unknown carrier");
  if (!(await isEnabled(carrierId))) return fail(`${adapter.name} is not enabled`);
  if (!adapter.hasApi || !adapter.createShipment) return fail(`${adapter.name} has no API integration. Export a CSV and enter the tracking number manually.`);
  const creds = await loadCredentials(carrierId);
  if (adapter.credentialFields.some((f) => !creds[f.key])) return fail(`${adapter.name} credentials are not configured`);
  const cfg = await loadConfig(carrierId);

  const loaded = await loadShipOrders(ids, carrierId);
  const out: SendResult[] = [];
  for (const id of ids) {
    const l = loaded.find((x) => x.order.id === id);
    if (!l) { out.push({ orderId: id, ok: false, error: "Order not found" }); continue; }
    if (l.tracking && l.carrierId === carrierId) { out.push({ orderId: id, ok: true, tracking: l.tracking }); continue; } // idempotent
    if (l.status !== "ready_to_ship") { out.push({ orderId: id, ok: false, error: `Order is "${l.status}", must be ready_to_ship` }); continue; }
    // Short lock against double-click / concurrent sends creating duplicate shipments.
    const lock = await rateLimit(`ship:${id}`, 1, 60);
    if (!lock.ok) { out.push({ orderId: id, ok: false, error: "A shipment for this order is already being created" }); continue; }
    try {
      const res = await retryAsync(() => adapter.createShipment!(l.order, creds, cfg));
      const labelKey = await storeLabel(l.order.number, res.labelPdf, res.labelUrl);
      await getEnv().DB.prepare("UPDATE orders SET carrier_id = ?, tracking_number = ?, label_key = ?, shipment_error = NULL, updated_at = ? WHERE id = ?").bind(carrierId, res.trackingNumber, labelKey, Date.now(), id).run();
      const st = await changeOrderStatus(id, "shipped", actor, { note: `Sent to ${adapter.name} (${res.trackingNumber})` });
      if (!st.ok) await setShipmentError(id, `Shipment created (${res.trackingNumber}) but status change failed: ${st.error}`);
      out.push({ orderId: id, ok: true, tracking: res.trackingNumber });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      await setShipmentError(id, msg);
      await getEnv().DB.prepare("DELETE FROM rate_limits WHERE key = ?").bind(`ship:${id}`).run().catch(() => {});
      out.push({ orderId: id, ok: false, error: msg });
    }
  }
  return out;
}

export async function exportCarrierCsv(carrierId: string, orderIds: string[]): Promise<{ filename: string; csv: string }> {
  const adapter = getAdapter(carrierId);
  if (!adapter) throw new Error("Unknown carrier");
  const loaded = await loadShipOrders([...new Set(orderIds)].slice(0, 500), carrierId);
  return { filename: csvFilename(carrierId), csv: buildCsv(adapter.csv, loaded.map((l) => l.order)) };
}

const TRACKING_RE = /^[A-Za-z0-9][A-Za-z0-9\-_./]{2,63}$/;

export async function setManualTracking(orderId: string, carrierId: string, trackingNumber: string, actor: Actor): Promise<{ ok: boolean; error?: string }> {
  const adapter = getAdapter(carrierId);
  if (!adapter) return { ok: false, error: "Unknown carrier" };
  const tn = trackingNumber.trim();
  if (!TRACKING_RE.test(tn)) return { ok: false, error: "Invalid tracking number" };
  const db = getEnv().DB;
  const o = await db.prepare("SELECT status FROM orders WHERE id = ?").bind(orderId).first<{ status: string }>();
  if (!o) return { ok: false, error: "Order not found" };
  if (!["ready_to_ship", "shipped", "out_for_delivery", "delivery_failed"].includes(o.status)) return { ok: false, error: `Order is "${o.status}"; tracking can be set once it is ready to ship` };
  await db.prepare("UPDATE orders SET carrier_id = ?, tracking_number = ?, shipment_error = NULL, updated_at = ? WHERE id = ?").bind(carrierId, tn, Date.now(), orderId).run();
  if (o.status === "ready_to_ship") {
    const st = await changeOrderStatus(orderId, "shipped", actor, { note: `Tracking ${tn} (${adapter.name}, manual)` });
    if (!st.ok) return { ok: false, error: st.error };
  }
  return { ok: true };
}

export type ApplyResult = "updated" | "unchanged" | "unknown_order" | "skipped";

/** Apply a carrier update (poll or webhook) to the order with this tracking number. Idempotent. */
export async function applyTrackingUpdate(carrierId: string, u: WebhookUpdate, log: (m: string) => void = () => {}): Promise<ApplyResult> {
  const db = getEnv().DB;
  const o = await db.prepare("SELECT id, status, carrier_status, carrier_fee, remitted FROM orders WHERE carrier_id = ? AND tracking_number = ?").bind(carrierId, u.trackingNumber).first<{ id: string; status: string; carrier_status: string | null; carrier_fee: number; remitted: number }>();
  if (!o) return "unknown_order";
  let changed = false;
  const sets: string[] = [];
  const vals: (string | number)[] = [];
  if (u.status && u.status !== o.carrier_status) { sets.push("carrier_status = ?"); vals.push(u.status.slice(0, 120)); changed = true; }
  if (typeof u.carrierFee === "number" && Number.isInteger(u.carrierFee) && u.carrierFee >= 0 && u.carrierFee !== o.carrier_fee) { sets.push("carrier_fee = ?"); vals.push(u.carrierFee); changed = true; }
  if (typeof u.remitted === "boolean" && u.remitted !== !!o.remitted) { sets.push("remitted = ?"); vals.push(u.remitted ? 1 : 0); changed = true; }
  if (sets.length) await db.prepare(`UPDATE orders SET ${sets.join(", ")}, updated_at = ? WHERE id = ?`).bind(...vals, Date.now(), o.id).run();
  if (u.mapped && u.mapped !== o.status) {
    const r = await changeOrderStatus(o.id, u.mapped, null, { note: `${carrierId}: ${u.status}` });
    if (r.ok) changed = true;
    else { log(`skip ${u.trackingNumber}: ${r.error}`); return changed ? "updated" : "skipped"; }
  }
  return changed ? "updated" : "unchanged";
}

export type SyncSummary = { checked: number; updated: number; skipped: number; errors: number; log: string[] };

/** Poll API carriers for in-flight orders and apply status / fee updates. Export-only carriers are never polled. */
export async function syncTracking(limit = 200): Promise<SyncSummary> {
  const db = getEnv().DB;
  const sum: SyncSummary = { checked: 0, updated: 0, skipped: 0, errors: 0, log: [] };
  const rows = (
    await db.prepare("SELECT carrier_id, tracking_number FROM orders WHERE status IN ('shipped','out_for_delivery','delivery_failed') AND tracking_number IS NOT NULL AND carrier_id IS NOT NULL ORDER BY updated_at ASC LIMIT ?").bind(limit).all<{ carrier_id: string; tracking_number: string }>()
  ).results;
  const creds = new Map<string, Awaited<ReturnType<typeof loadCredentials>> | null>();
  for (const r of rows) {
    const adapter = getAdapter(r.carrier_id);
    if (!adapter?.hasApi || !adapter.getTracking) continue;
    if (!creds.has(r.carrier_id)) creds.set(r.carrier_id, (await isEnabled(r.carrier_id)) ? await loadCredentials(r.carrier_id) : null);
    const c = creds.get(r.carrier_id);
    if (!c) continue;
    sum.checked++;
    try {
      const t = await retryAsync(() => adapter.getTracking!(r.tracking_number, c));
      const res = await applyTrackingUpdate(r.carrier_id, { trackingNumber: r.tracking_number, status: t.status, mapped: t.mapped as OrderStatus | null, cashCollected: t.cashCollected, carrierFee: t.carrierFee, remitted: t.remitted }, (m) => sum.log.push(m));
      if (res === "updated") sum.updated++; else if (res === "skipped") sum.skipped++;
    } catch (e) {
      sum.errors++;
      sum.log.push(`${r.carrier_id}/${r.tracking_number}: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  return sum;
}
