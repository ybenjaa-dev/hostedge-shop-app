import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";

export type AgentStats = {
  userId: string; name: string; role: string; active: boolean;
  handled: number; confirmed: number; cancelled: number; noAnswer: number; postponed: number; shipped: number;
  confirmRate: number | null;       // confirmed ÷ handled
  avgResponseMin: number | null;    // order placed → this agent's first action (orders where they were first)
  delivered: number; failed: number; // fate of the orders they confirmed (delivered vs returned / failed)
  deliveredRate: number | null;     // delivered ÷ (delivered + failed)
  cashDelivered: number;            // total of delivered orders they confirmed (minor units)
};

const FAILED = new Set(["delivery_failed", "returned", "return_received", "refunded"]);

/** Per-teammate performance for a date range, built from the order history (who moved which order to which status). */
export async function teamPerformance(fromMs: number, toMs: number): Promise<{ agents: AgentStats[]; orders: number; confirmedTotal: number }> {
  await ensureSchema();
  const db = getEnv().DB;
  const [users, rows, total] = await db.batch([
    db.prepare("SELECT id, name, role, active FROM users"),
    db.prepare(`SELECT h.user_id AS uid, h.to_status AS to_status, h.order_id AS oid, h.created_at AS at, o.created_at AS placed, o.status AS cur, o.total AS total
      FROM order_history h JOIN orders o ON o.id = h.order_id
      WHERE h.user_id IS NOT NULL AND h.created_at BETWEEN ?1 AND ?2 ORDER BY h.created_at`).bind(fromMs, toMs),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE created_at BETWEEN ?1 AND ?2").bind(fromMs, toMs),
  ]);
  type H = { uid: string; to_status: string; oid: string; at: number; placed: number; cur: string; total: number };
  const hist = rows!.results as H[];
  const firstActor = new Map<string, { uid: string; at: number; placed: number }>();
  for (const h of hist) if (!firstActor.has(h.oid)) firstActor.set(h.oid, { uid: h.uid, at: h.at, placed: h.placed });
  const agents = new Map<string, AgentStats & { _h: Set<string>; _c: Set<string>; _resp: number[] }>();
  for (const u of users!.results as { id: string; name: string; role: string; active: number }[]) {
    agents.set(u.id, { userId: u.id, name: u.name, role: u.role, active: !!u.active, handled: 0, confirmed: 0, cancelled: 0, noAnswer: 0, postponed: 0, shipped: 0, confirmRate: null, avgResponseMin: null, delivered: 0, failed: 0, deliveredRate: null, cashDelivered: 0, _h: new Set(), _c: new Set(), _resp: [] });
  }
  const seen = new Set<string>();
  for (const h of hist) {
    const a = agents.get(h.uid); if (!a) continue;
    a._h.add(h.oid);
    const key = `${h.uid}:${h.oid}:${h.to_status}`;
    if (seen.has(key)) continue; seen.add(key);
    if (h.to_status === "confirmed") { a.confirmed++; a._c.add(h.oid); if (h.cur === "delivered") { a.delivered++; a.cashDelivered += h.total; } else if (FAILED.has(h.cur)) a.failed++; }
    else if (h.to_status === "cancelled") a.cancelled++;
    else if (h.to_status === "no_answer") a.noAnswer++;
    else if (h.to_status === "postponed") a.postponed++;
    else if (h.to_status === "shipped" || h.to_status === "ready_to_ship") a.shipped++;
  }
  for (const [oid, f] of firstActor) { const a = agents.get(f.uid); if (a) a._resp.push(Math.max(0, (f.at - f.placed) / 60000)); void oid; }
  const list = [...agents.values()].map(({ _h, _c, _resp, ...a }) => {
    a.handled = _h.size;
    a.confirmRate = a.handled ? a.confirmed / a.handled : null;
    a.avgResponseMin = _resp.length ? _resp.reduce((x, y) => x + y, 0) / _resp.length : null;
    a.deliveredRate = a.delivered + a.failed ? a.delivered / (a.delivered + a.failed) : null;
    return a as AgentStats;
  }).filter((a) => a.handled > 0 || a.active).sort((a, b) => b.handled - a.handled);
  return { agents: list, orders: (total!.results[0] as { n: number }).n, confirmedTotal: list.reduce((s, a) => s + a.confirmed, 0) };
}
