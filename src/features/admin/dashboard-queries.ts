import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";

export type DashData = {
  orders: number; today: number; revenue: number; collected: number; pendingConfirm: number;
  confirmationRate: number; deliveryRate: number; returnRate: number;
  series: { day: string; orders: number; revenue: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  topCities: { city: string; orders: number }[];
  recent: { id: string; number: string; name: string; status: string; total: number; createdAt: number }[];
};

const DAY = 86400_000;

export async function getDashboard(from: number, to: number): Promise<DashData> {
  await ensureSchema();
  const db = getEnv().DB;
  const range = "o.created_at >= ?1 AND o.created_at < ?2";
  const live = "o.status NOT IN ('cancelled','refunded')";
  const startToday = Math.floor(Date.now() / DAY) * DAY;
  const [sum, today, series, prod, cities, recent, pend] = await db.batch([
    db.prepare(`SELECT COUNT(*) AS orders,
        COALESCE(SUM(CASE WHEN ${live} THEN o.total END),0) AS revenue,
        COALESCE(SUM(o.cash_collected),0) AS collected,
        SUM(CASE WHEN EXISTS (SELECT 1 FROM order_history h WHERE h.order_id=o.id AND h.to_status='confirmed') THEN 1 ELSE 0 END) AS confirmed,
        SUM(CASE WHEN EXISTS (SELECT 1 FROM order_history h WHERE h.order_id=o.id AND h.to_status='shipped') THEN 1 ELSE 0 END) AS shipped,
        SUM(CASE WHEN o.status='delivered' THEN 1 ELSE 0 END) AS delivered,
        SUM(CASE WHEN o.status IN ('returned','return_received') THEN 1 ELSE 0 END) AS returned
      FROM orders o WHERE ${range}`).bind(from, to),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE created_at >= ?").bind(startToday),
    db.prepare(`SELECT strftime('%Y-%m-%d', o.created_at/1000, 'unixepoch') AS day, COUNT(*) AS orders, COALESCE(SUM(CASE WHEN ${live} THEN o.total END),0) AS revenue FROM orders o WHERE ${range} GROUP BY day ORDER BY day`).bind(from, to),
    db.prepare(`SELECT i.name, SUM(i.qty) AS qty, SUM(i.price*i.qty) AS revenue FROM order_items i JOIN orders o ON o.id=i.order_id WHERE ${range} AND ${live} GROUP BY i.product_id, i.name ORDER BY qty DESC LIMIT 5`).bind(from, to),
    db.prepare(`SELECT o.city, COUNT(*) AS orders FROM orders o WHERE ${range} GROUP BY o.city ORDER BY orders DESC LIMIT 5`).bind(from, to),
    db.prepare("SELECT id, number, name, status, total, created_at AS createdAt FROM orders ORDER BY created_at DESC LIMIT 6"),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status IN ('new','pending_confirmation')"),
  ]);
  const s = (sum!.results as Record<string, number>[])[0] ?? {};
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
  // fill empty days so the chart is continuous
  const map = new Map((series!.results as { day: string; orders: number; revenue: number }[]).map((r) => [r.day, r]));
  const filled: DashData["series"] = [];
  for (let t = Math.floor(from / DAY) * DAY; t < to && filled.length < 120; t += DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    filled.push(map.get(day) ?? { day, orders: 0, revenue: 0 });
  }
  return {
    orders: s.orders ?? 0,
    today: (today!.results as { n: number }[])[0]?.n ?? 0,
    revenue: s.revenue ?? 0,
    collected: s.collected ?? 0,
    pendingConfirm: (pend!.results as { n: number }[])[0]?.n ?? 0,
    confirmationRate: pct(s.confirmed ?? 0, s.orders ?? 0),
    deliveryRate: pct(s.delivered ?? 0, s.shipped ?? 0),
    returnRate: pct(s.returned ?? 0, s.shipped ?? 0),
    series: filled,
    topProducts: prod!.results as DashData["topProducts"],
    topCities: cities!.results as DashData["topCities"],
    recent: recent!.results as DashData["recent"],
  };
}
