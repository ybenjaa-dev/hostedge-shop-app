import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { tr } from "@/lib/i18n-core";
import { previousPeriod, safeRate, type DayRow } from "./math";

/**
 * Cohort KPIs: every order *placed* in [from, to). Per-order milestones come from one grouped pass over order_history
 * (restricted to those orders); the current status backs them up for orders that skipped a history row.
 */
const MILESTONES = `WITH m AS (
  SELECT h.order_id AS oid,
    MIN(CASE WHEN h.to_status IN ('confirmed','no_answer','postponed','cancelled') THEN h.created_at END) AS handled_at,
    MIN(CASE WHEN h.to_status = 'confirmed' THEN h.created_at END) AS conf_at,
    MIN(CASE WHEN h.to_status = 'shipped' THEN h.created_at END) AS ship_at,
    MAX(h.to_status = 'no_answer') AS had_na
  FROM order_history h JOIN orders o ON o.id = h.order_id
  WHERE o.created_at >= ?1 AND o.created_at < ?2 GROUP BY h.order_id)`;
const POST_CONFIRM = "('ready_to_ship','shipped','out_for_delivery','delivered','delivery_failed','returned','return_received','refunded')";
const POST_SHIP = "('shipped','out_for_delivery','delivered','delivery_failed','returned','return_received','refunded')";
const BAD_END = "('delivery_failed','returned','return_received','refunded')";
export const F = {
  handled: `(m.handled_at IS NOT NULL OR o.status NOT IN ('new','pending_confirmation'))`,
  confirmed: `(m.conf_at IS NOT NULL OR o.status IN ${POST_CONFIRM})`,
  shipped: `(m.ship_at IS NOT NULL OR o.status IN ${POST_SHIP})`,
  delivered: `(o.status = 'delivered')`,
  failed: `(o.status IN ${BAD_END})`,
  live: `(o.status NOT IN ('cancelled'))`,
};
const FROM = "FROM orders o LEFT JOIN m ON m.oid = o.id WHERE o.created_at >= ?1 AND o.created_at < ?2";
const sum = (cond: string) => `COALESCE(SUM(CASE WHEN ${cond} THEN 1 ELSE 0 END),0)`;

export type Totals = {
  orders: number; handled: number; confirmed: number; shipped: number; delivered: number; failed: number; cancelled: number; noAnswer: number; open: number;
  deliveredRevenue: number; grossValue: number; liveOrders: number;
  avgHandleMin: number | null; avgConfirmMin: number | null; avgShipMin: number | null;
  addonOrders: number; offerOrders: number;
};
export type Abandoned = { total: number; recovered: number } | null;
export type Breakdown = { key: string; label: string; orders: number; shipped: number; delivered: number; failed: number; revenue: number };
export type ProductRow = Breakdown & { qty: number };
export type KpiData = {
  cur: Totals; prev: Totals; days: DayRow[];
  heat: number[][]; // [weekday 0=Sun][hour 0-23] → orders (UTC)
  cities: Breakdown[]; carriers: Breakdown[]; channels: Breakdown[]; products: ProductRow[];
  abandoned: { cur: Abandoned; prev: Abandoned };
};

const totalsSql = () => `${MILESTONES} SELECT COUNT(*) AS orders, ${sum(F.handled)} AS handled, ${sum(F.confirmed)} AS confirmed, ${sum(F.shipped)} AS shipped,
  ${sum(F.delivered)} AS delivered, ${sum(F.failed)} AS failed, ${sum("o.status = 'cancelled'")} AS cancelled, ${sum("m.had_na = 1")} AS noAnswer,
  ${sum("o.status IN ('new','pending_confirmation','confirmed','no_answer','postponed','ready_to_ship','shipped','out_for_delivery')")} AS open,
  COALESCE(SUM(CASE WHEN ${F.delivered} THEN o.total END),0) AS deliveredRevenue,
  COALESCE(SUM(CASE WHEN ${F.live} THEN o.total END),0) AS grossValue, ${sum(F.live)} AS liveOrders,
  AVG(CASE WHEN m.handled_at >= o.created_at THEN (m.handled_at - o.created_at) / 60000.0 END) AS avgHandleMin,
  AVG(CASE WHEN m.conf_at >= o.created_at THEN (m.conf_at - o.created_at) / 60000.0 END) AS avgConfirmMin,
  AVG(CASE WHEN m.ship_at >= m.conf_at THEN (m.ship_at - m.conf_at) / 60000.0 END) AS avgShipMin,
  ${sum("EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.addon = 1)")} AS addonOrders,
  ${sum("o.discount > 0 AND o.coupon_code IS NULL")} AS offerOrders ${FROM}`;

const groupSql = (expr: string, limit = 10) => `${MILESTONES} SELECT ${expr} AS k, COUNT(*) AS orders, ${sum(F.shipped)} AS shipped, ${sum(F.delivered)} AS delivered, ${sum(F.failed)} AS failed,
  COALESCE(SUM(CASE WHEN ${F.delivered} THEN o.total END),0) AS revenue ${FROM} GROUP BY k ORDER BY orders DESC LIMIT ${limit}`;

const toBreakdown = (rows: unknown, name: (k: string | null) => string): Breakdown[] =>
  (rows as { k: string | null; orders: number; shipped: number; delivered: number; failed: number; revenue: number }[]).map((r) => ({ key: r.k ?? "", label: name(r.k), orders: r.orders, shipped: r.shipped, delivered: r.delivered, failed: r.failed, revenue: r.revenue }));

async function abandoned(db: D1Database, from: number, to: number): Promise<Abandoned> {
  try {
    const r = await db.prepare("SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END),0) AS recovered FROM abandoned_orders WHERE created_at >= ?1 AND created_at < ?2").bind(from, to).first<{ total: number; recovered: number }>();
    return r ? { total: r.total, recovered: r.recovered } : null;
  } catch { return null; }
}

/** Everything the KPI sections need for [from, to) and the equal-length period before it, in one D1 batch (+ one tolerant read of abandoned checkouts). */
export async function getKpiData(from: number, to: number): Promise<KpiData> {
  await ensureSchema();
  const db = getEnv().DB;
  const p = previousPeriod(from, to);
  const [cur, prev, daily, heat, cities, carriers, channels, products] = await db.batch([
    db.prepare(totalsSql()).bind(from, to),
    db.prepare(totalsSql()).bind(p.from, p.to),
    db.prepare(`${MILESTONES} SELECT strftime('%Y-%m-%d', o.created_at/1000, 'unixepoch') AS day, COUNT(*) AS orders, ${sum(F.handled)} AS handled, ${sum(F.confirmed)} AS confirmed, ${sum(F.delivered)} AS delivered ${FROM} GROUP BY day`).bind(from, to),
    db.prepare("SELECT CAST(strftime('%w', created_at/1000, 'unixepoch') AS INTEGER) AS dow, CAST(strftime('%H', created_at/1000, 'unixepoch') AS INTEGER) AS hr, COUNT(*) AS n FROM orders WHERE created_at >= ?1 AND created_at < ?2 GROUP BY dow, hr").bind(from, to),
    db.prepare(groupSql("o.city")).bind(from, to),
    db.prepare(groupSql("o.carrier_id")).bind(from, to),
    db.prepare(groupSql(`CASE WHEN json_valid(o.tracking) AND json_extract(o.tracking,'$.ttclid') IS NOT NULL THEN 'tiktok' WHEN json_valid(o.tracking) AND (json_extract(o.tracking,'$.fbc') IS NOT NULL) THEN 'meta' ELSE 'other' END`)).bind(from, to),
    db.prepare(`${MILESTONES} SELECT COALESCE(i.product_id, i.name) AS k, MAX(i.name) AS name, COUNT(DISTINCT o.id) AS orders, SUM(i.qty) AS qty,
      COUNT(DISTINCT CASE WHEN ${F.shipped} THEN o.id END) AS shipped, COUNT(DISTINCT CASE WHEN ${F.delivered} THEN o.id END) AS delivered, COUNT(DISTINCT CASE WHEN ${F.failed} THEN o.id END) AS failed,
      COALESCE(SUM(CASE WHEN ${F.delivered} THEN i.price * i.qty END),0) AS revenue
      FROM order_items i JOIN orders o ON o.id = i.order_id LEFT JOIN m ON m.oid = o.id WHERE o.created_at >= ?1 AND o.created_at < ?2 GROUP BY k LIMIT 200`).bind(from, to),
  ]);
  const t = (r: D1Result): Totals => {
    const x = (r.results[0] ?? {}) as Record<string, number | null>;
    const n = (k: string) => Number(x[k] ?? 0), o = (k: string) => (x[k] == null ? null : Number(x[k]));
    return { orders: n("orders"), handled: n("handled"), confirmed: n("confirmed"), shipped: n("shipped"), delivered: n("delivered"), failed: n("failed"), cancelled: n("cancelled"), noAnswer: n("noAnswer"), open: n("open"),
      deliveredRevenue: n("deliveredRevenue"), grossValue: n("grossValue"), liveOrders: n("liveOrders"), avgHandleMin: o("avgHandleMin"), avgConfirmMin: o("avgConfirmMin"), avgShipMin: o("avgShipMin"), addonOrders: n("addonOrders"), offerOrders: n("offerOrders") };
  };
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const r of heat!.results as { dow: number; hr: number; n: number }[]) if (grid[r.dow]) grid[r.dow]![r.hr] = r.n;
  const pr = (products!.results as { k: string; name: string; orders: number; qty: number; shipped: number; delivered: number; failed: number; revenue: number }[])
    .map((r): ProductRow => ({ key: r.k, label: tr(r.name, "en") || r.name, orders: r.orders, qty: r.qty, shipped: r.shipped, delivered: r.delivered, failed: r.failed, revenue: r.revenue }));
  const [aCur, aPrev] = await Promise.all([abandoned(db, from, to), abandoned(db, p.from, p.to)]);
  return {
    cur: t(cur!), prev: t(prev!), days: daily!.results as DayRow[], heat: grid,
    cities: toBreakdown(cities!.results, (k) => k || "Unknown"),
    carriers: toBreakdown(carriers!.results, (k) => (k ? k.charAt(0).toUpperCase() + k.slice(1) : "Not assigned")),
    channels: toBreakdown(channels!.results, (k) => ({ meta: "Meta ads", tiktok: "TikTok ads" }[k ?? ""] ?? "Direct / other")),
    products: pr, abandoned: { cur: aCur, prev: aPrev },
  };
}

export const rates = (x: Totals) => ({
  confirmation: safeRate(x.confirmed, x.handled), delivery: safeRate(x.delivered, x.shipped), returns: safeRate(x.failed, x.shipped),
  cancelled: safeRate(x.cancelled, x.orders), noAnswer: safeRate(x.noAnswer, x.handled),
  aov: x.liveOrders ? x.grossValue / x.liveOrders : null, addon: safeRate(x.addonOrders, x.orders), offer: safeRate(x.offerOrders, x.orders),
});
