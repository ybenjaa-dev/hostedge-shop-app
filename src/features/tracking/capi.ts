import "server-only";
import { getEnv, waitUntil } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings, getRaw, setRaw } from "@/lib/settings";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { decimalsOf } from "@/lib/money";
import { newId } from "@/lib/id";
import { getInstallSecret } from "@/features/orders/service";
import { metaEvent, planEvents, tiktokEvent, tooOld, type Kind, type OrderCtx, type PlannedEvent } from "./capi-core";

type Secrets = { meta?: string; tiktok?: string };
const KEY = "capi_secrets";

export async function getCapiSecrets(): Promise<Secrets> {
  const raw = await getRaw(KEY);
  if (!raw) return {};
  try { return await decryptJson<Secrets>(raw, await getInstallSecret()); } catch { return {}; }
}
export async function saveCapiSecrets(patch: { meta?: string | null; tiktok?: string | null }) {
  const cur = await getCapiSecrets();
  const next: Secrets = { ...cur };
  for (const k of ["meta", "tiktok"] as const) { if (patch[k] === null) delete next[k]; else if (patch[k]) next[k] = patch[k]!; }
  await setRaw(KEY, await encryptJson(next, await getInstallSecret()));
}
export const lastChars = (t?: string) => (t ? `••••${t.slice(-4)}` : "");

async function post(url: string, body: unknown, headers: Record<string, string> = {}): Promise<{ ok: boolean; status: number; text: string }> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body), signal: ctl.signal });
    return { ok: r.ok, status: r.status, text: (await r.text()).slice(0, 600) };
  } catch (e) {
    return { ok: false, status: 0, text: e instanceof Error ? e.message.slice(0, 200) : "network error" };
  } finally { clearTimeout(t); }
}

async function sendOne(ev: PlannedEvent, o: OrderCtx, timeSec: number, cfg: { pixel: string; token: string; test?: string }) {
  if (ev.platform === "meta") {
    const body = { data: [await metaEvent(ev, o, timeSec)], ...(cfg.test ? { test_event_code: cfg.test } : {}) };
    const r = await post(`https://graph.facebook.com/v21.0/${encodeURIComponent(cfg.pixel)}/events?access_token=${encodeURIComponent(cfg.token)}`, body);
    let ok = r.ok; try { ok = r.ok && (JSON.parse(r.text) as { events_received?: number }).events_received !== 0; } catch { /* keep http result */ }
    return { ...r, ok };
  }
  const r = await post("https://business-api.tiktok.com/open_api/v1.3/event/track/", await tiktokEvent(ev, o, timeSec, cfg.pixel, cfg.test), { "Access-Token": cfg.token });
  let ok = r.ok; try { ok = r.ok && (JSON.parse(r.text) as { code?: number }).code === 0; } catch { /* keep */ }
  return { ...r, ok };
}

async function loadOrder(orderId: string): Promise<{ ctx: OrderCtx; createdAt: number } | null> {
  const db = getEnv().DB;
  const [o, items] = await Promise.all([
    db.prepare("SELECT number, total, currency, phone, name, city, country, customer_id AS customerId, ip, tracking, created_at AS createdAt FROM orders WHERE id = ?").bind(orderId).first<Record<string, string | number | null>>(),
    db.prepare("SELECT product_id AS id, qty, price FROM order_items WHERE order_id = ? AND product_id IS NOT NULL").bind(orderId).all<{ id: string; qty: number; price: number }>(),
  ]);
  if (!o) return null;
  let t: Record<string, string | null> = {};
  try { t = JSON.parse((o.tracking as string) || "{}"); } catch { /* none */ }
  return {
    createdAt: o.createdAt as number,
    ctx: { number: o.number as string, total: o.total as number, currency: o.currency as string, decimals: decimalsOf(o.currency as string), phone: String(o.phone), name: o.name as string, city: o.city as string, country: o.country as string, customerId: (o.customerId as string) ?? null, ip: (o.ip as string) ?? null, ua: t.ua ?? null, url: t.url ?? null, fbp: t.fbp ?? null, fbc: t.fbc ?? null, ttp: t.ttp ?? null, ttclid: t.ttclid ?? null, items: items.results },
  };
}

async function record(orderId: string | null, ev: PlannedEvent, res: { ok: boolean; status: number; text: string }, status: "ok" | "error" | "test") {
  const db = getEnv().DB;
  const now = Date.now();
  await db.prepare(`INSERT INTO tracking_events (id, order_id, platform, event, event_id, status, http_status, response, attempts, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,1,?,?)
    ON CONFLICT(platform, event_id, event) DO UPDATE SET status = excluded.status, http_status = excluded.http_status, response = excluded.response, attempts = attempts + 1, updated_at = excluded.updated_at`)
    .bind(newId(), orderId, ev.platform, ev.name, ev.id, status, res.status || null, res.text, now, now).run();
}

/** Send the server-side events an order status change calls for (idempotent: an event that already succeeded is never sent twice). */
export async function dispatchOrderEvent(orderId: string, kind: Kind): Promise<void> {
  try {
    await ensureSchema();
    const s = await getSettings();
    const a = s.analytics;
    const secrets = await getCapiSecrets();
    const platforms = { meta: !!(a.metaPixel && secrets.meta), tiktok: !!(a.tiktokPixel && secrets.tiktok) };
    if (!platforms.meta && !platforms.tiktok) return;
    const loaded = await loadOrder(orderId);
    if (!loaded) return;
    const plan = planEvents(kind, loaded.ctx.number, a.capi.purchaseWhen, a.capi.statusEvents, platforms);
    for (const ev of plan) {
      const done = await getEnv().DB.prepare("SELECT status FROM tracking_events WHERE platform = ? AND event_id = ? AND event = ?").bind(ev.platform, ev.id, ev.name).first<{ status: string }>();
      if (done?.status === "ok") continue;
      // the placement event is sent at order time; later ones carry "now". Meta rejects events older than ~7 days.
      const timeSec = Math.floor((kind === "placed" ? loaded.createdAt : Date.now()) / 1000);
      if (tooOld(timeSec * 1000)) continue;
      const cfg = ev.platform === "meta" ? { pixel: a.metaPixel, token: secrets.meta!, test: a.capi.metaTestCode || undefined } : { pixel: a.tiktokPixel, token: secrets.tiktok!, test: a.capi.tiktokTestCode || undefined };
      const res = await sendOne(ev, loaded.ctx, timeSec, cfg);
      await record(orderId, ev, res, res.ok ? "ok" : "error");
    }
  } catch (e) { console.error("capi dispatch failed", e); }
}
export const dispatchInBackground = (orderId: string, kind: Kind) => waitUntil(dispatchOrderEvent(orderId, kind));

/** Re-send events that failed in the last day (called from the cron and from the "Retry" button). */
export async function retryFailedEvents(limit = 25): Promise<number> {
  await ensureSchema();
  const rows = await getEnv().DB.prepare("SELECT order_id AS orderId, event, event_id AS eventId FROM tracking_events WHERE status = 'error' AND attempts < 6 AND updated_at > ? AND order_id IS NOT NULL ORDER BY updated_at LIMIT ?").bind(Date.now() - 864e5, limit).all<{ orderId: string; event: string; eventId: string }>();
  const orders = [...new Set(rows.results.map((r) => r.orderId))];
  for (const id of orders) for (const k of ["placed", "confirmed", "delivered", "returned"] as Kind[]) await dispatchOrderEvent(id, k);
  return rows.results.length;
}

/** "Send a test event" button: a fake purchase tagged with the test code so it appears in the platform's Test Events tab. */
export async function sendTestEvent(platform: "meta" | "tiktok"): Promise<{ ok: boolean; message: string }> {
  await ensureSchema();
  const s = await getSettings();
  const secrets = await getCapiSecrets();
  const a = s.analytics;
  const pixel = platform === "meta" ? a.metaPixel : a.tiktokPixel, token = platform === "meta" ? secrets.meta : secrets.tiktok, test = platform === "meta" ? a.capi.metaTestCode : a.capi.tiktokTestCode;
  if (!pixel) return { ok: false, message: `Add your ${platform === "meta" ? "Meta" : "TikTok"} Pixel ID first.` };
  if (!token) return { ok: false, message: "Add the access token first." };
  if (!test) return { ok: false, message: "Enter the test event code from the platform’s Test Events page, then save." };
  const id = `test-${Date.now()}`;
  const ev: PlannedEvent = { platform, name: "Purchase", id };
  const ctx: OrderCtx = { number: id, total: 10000, currency: s.store.currency, decimals: decimalsOf(s.store.currency), phone: "212600000000", name: "Test Customer", city: "Casablanca", country: "MA", customerId: null, ip: null, ua: "HostEdge test", url: null, fbp: null, fbc: null, ttp: null, ttclid: null, items: [{ id: "test", qty: 1, price: 10000 }] };
  const res = await sendOne(ev, ctx, Math.floor(Date.now() / 1000), { pixel, token, test });
  await record(null, ev, res, res.ok ? "test" : "error");
  return { ok: res.ok, message: res.ok ? "Sent — open the Test Events tab in the platform to see it." : `Rejected (${res.status || "no connection"}): ${res.text.slice(0, 160)}` };
}
