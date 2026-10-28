import { sha256Hex } from "@/lib/crypto";

/** Pure helpers for the Meta / TikTok Conversions API: which events to send, and how the payloads look. No I/O, so it is unit-tested. */
export type PurchaseWhen = "placed" | "confirmed" | "delivered";
export type Kind = "placed" | "confirmed" | "delivered" | "returned";

export type OrderCtx = {
  number: string; total: number; currency: string; decimals: number;
  phone: string;            // E.164 digits, no "+"
  name: string; city: string; country: string; customerId: string | null;
  ip: string | null; ua: string | null; url: string | null;
  fbp: string | null; fbc: string | null; ttp: string | null; ttclid: string | null;
  items: { id: string; qty: number; price: number }[];
};
export type PlannedEvent = { platform: "meta" | "tiktok"; name: string; id: string };

/** What to send for a status change, given the owner's "count a sale when…" choice. */
export function planEvents(kind: Kind, number: string, when: PurchaseWhen, statusEvents: boolean, platforms: { meta: boolean; tiktok: boolean }): PlannedEvent[] {
  const out: PlannedEvent[] = [];
  const add = (meta: string | null, tiktok: string | null, id = number) => {
    if (platforms.meta && meta) out.push({ platform: "meta", name: meta, id });
    if (platforms.tiktok && tiktok) out.push({ platform: "tiktok", name: tiktok, id });
  };
  const purchase = () => add("Purchase", when === "placed" ? "PlaceAnOrder" : "CompletePayment");
  if (kind === "placed") { if (when === "placed") purchase(); else add("Lead", "SubmitForm"); }
  if (kind === "confirmed") { if (when === "confirmed") purchase(); else if (statusEvents) add("OrderConfirmed", "Contact", `${number}-confirmed`); }
  if (kind === "delivered") { if (when === "delivered") purchase(); else if (statusEvents) add("OrderDelivered", "CompleteRegistration", `${number}-delivered`); }
  if (kind === "returned" && statusEvents) add("OrderReturned", "Contact", `${number}-returned`);
  return out;
}
/** The event name the browser pixel should fire at checkout so it pairs (same name + id) with the server event. */
export const browserEvent = (when: PurchaseWhen): "Purchase" | "Lead" => (when === "placed" ? "Purchase" : "Lead");

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();
const hash = async (s: string | null | undefined) => (norm(s) ? sha256Hex(norm(s)) : undefined);
const major = (o: OrderCtx) => Math.round((o.total / 10 ** o.decimals) * 100) / 100;
const splitName = (n: string) => { const p = n.trim().split(/\s+/); return { fn: p[0] ?? "", ln: p.length > 1 ? p[p.length - 1]! : "" }; };

export async function metaEvent(ev: PlannedEvent, o: OrderCtx, timeSec: number) {
  const { fn, ln } = splitName(o.name);
  const user: Record<string, unknown> = {
    ph: [await hash(o.phone.replace(/\D/g, ""))], fn: [await hash(fn)], ln: ln ? [await hash(ln)] : undefined,
    ct: [await hash(o.city.replace(/[^\p{L}]/gu, ""))], country: [await hash(o.country)],
    external_id: [await hash(o.customerId ?? o.phone)],
    client_ip_address: o.ip || undefined, client_user_agent: o.ua || undefined, fbp: o.fbp || undefined, fbc: o.fbc || undefined,
  };
  for (const k of Object.keys(user)) if (user[k] === undefined || (Array.isArray(user[k]) && (user[k] as unknown[]).every((x) => x === undefined))) delete user[k];
  return {
    event_name: ev.name, event_time: timeSec, event_id: ev.id, action_source: "website", event_source_url: o.url || undefined, user_data: user,
    custom_data: { currency: o.currency, value: major(o), order_id: o.number, content_type: "product", content_ids: o.items.map((i) => i.id), num_items: o.items.reduce((n, i) => n + i.qty, 0), contents: o.items.map((i) => ({ id: i.id, quantity: i.qty, item_price: Math.round((i.price / 10 ** o.decimals) * 100) / 100 })) },
  };
}

export async function tiktokEvent(ev: PlannedEvent, o: OrderCtx, timeSec: number, pixel: string, testCode?: string) {
  const user: Record<string, unknown> = {
    phone: await sha256Hex(`+${o.phone.replace(/\D/g, "")}`), external_id: await hash(o.customerId ?? o.phone),
    ip: o.ip || undefined, user_agent: o.ua || undefined, ttp: o.ttp || undefined, ttclid: o.ttclid || undefined,
  };
  for (const k of Object.keys(user)) if (user[k] === undefined) delete user[k];
  return {
    event_source: "web", event_source_id: pixel, ...(testCode ? { test_event_code: testCode } : {}),
    data: [{ event: ev.name, event_time: timeSec, event_id: ev.id, user, page: o.url ? { url: o.url } : undefined,
      properties: { currency: o.currency, value: major(o), order_id: o.number, content_type: "product", contents: o.items.map((i) => ({ content_id: i.id, quantity: i.qty, price: Math.round((i.price / 10 ** o.decimals) * 100) / 100 })) } }],
  };
}

/** Meta wants events no older than 7 days. */
export const tooOld = (createdAtMs: number, nowMs = Date.now()) => nowMs - createdAtMs > 7 * 864e5 - 3600_000;
