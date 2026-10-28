import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { safeRate } from "@/features/performance/math";

export type AgentAction = { orderId: string; number: string; from: string | null; to: string; at: number };
export type AgentStats = {
  userId: string; name: string; role: string; active: boolean;
  handled: number; confirmed: number; cancelled: number; noAnswer: number; postponed: number; shipped: number;
  confirmRate: number | null;       // confirmed ÷ handled
  avgResponseMin: number | null;    // order placed → this agent's first action (orders where they were first)
  delivered: number; failed: number; // fate of the orders they confirmed (delivered vs returned / failed)
  deliveredRate: number | null;     // delivered ÷ (delivered + failed): "quality of confirmation"
  cashDelivered: number;            // total of delivered orders they confirmed (minor units)
  perDay: number;                   // handled ÷ days in range
  recent: AgentAction[];            // last 20 actions in range
};

const FAILED = "('delivery_failed','returned','return_received','refunded')";
const REAL = "h.user_id IS NOT NULL AND h.created_at >= ?1 AND h.created_at < ?2 AND (h.from_status IS NULL OR h.from_status <> h.to_status)";

/** Per-teammate performance for [from, to), aggregated in SQL from the order history (who moved which order to which status). */
export async function teamPerformance(from: number, to: number): Promise<{ agents: AgentStats[]; orders: number; confirmedTotal: number }> {
  await ensureSchema();
  const db = getEnv().DB;
  const [users, counts, quality, first, recent, total] = await db.batch([
    db.prepare("SELECT id, name, role, active FROM users"),
    db.prepare(`SELECT h.user_id AS uid, COUNT(DISTINCT h.order_id) AS handled,
        COUNT(DISTINCT CASE WHEN h.to_status = 'confirmed' THEN h.order_id END) AS confirmed,
        COUNT(DISTINCT CASE WHEN h.to_status = 'cancelled' THEN h.order_id END) AS cancelled,
        COUNT(DISTINCT CASE WHEN h.to_status = 'no_answer' THEN h.order_id END) AS noAnswer,
        COUNT(DISTINCT CASE WHEN h.to_status = 'postponed' THEN h.order_id END) AS postponed,
        COUNT(DISTINCT CASE WHEN h.to_status IN ('shipped','ready_to_ship') THEN h.order_id END) AS shipped
      FROM order_history h WHERE ${REAL} GROUP BY h.user_id`).bind(from, to),
    db.prepare(`WITH c AS (SELECT DISTINCT h.user_id AS uid, h.order_id AS oid FROM order_history h WHERE ${REAL} AND h.to_status = 'confirmed')
      SELECT c.uid AS uid, SUM(o.status = 'delivered') AS delivered, SUM(o.status IN ${FAILED}) AS failed,
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total END), 0) AS cash
      FROM c JOIN orders o ON o.id = c.oid GROUP BY c.uid`).bind(from, to),
    db.prepare(`SELECT uid, AVG(MAX(0, at - placed) / 60000.0) AS avgMin FROM (
        SELECT h.user_id AS uid, MIN(h.created_at) AS at, o.created_at AS placed FROM order_history h JOIN orders o ON o.id = h.order_id
        WHERE ${REAL} GROUP BY h.order_id) GROUP BY uid`).bind(from, to),
    db.prepare(`SELECT * FROM (SELECT h.user_id AS uid, h.order_id AS oid, o.number AS number, h.from_status AS fromStatus, h.to_status AS toStatus, h.created_at AS at,
        ROW_NUMBER() OVER (PARTITION BY h.user_id ORDER BY h.created_at DESC) AS rn
        FROM order_history h JOIN orders o ON o.id = h.order_id WHERE ${REAL}) WHERE rn <= 20 ORDER BY at DESC`).bind(from, to),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE created_at >= ?1 AND created_at < ?2").bind(from, to),
  ]);
  const days = Math.max(1, (to - from) / 864e5);
  const by = <T extends { uid: string }>(r: D1Result) => new Map((r.results as T[]).map((x) => [x.uid, x]));
  const c = by<{ uid: string; handled: number; confirmed: number; cancelled: number; noAnswer: number; postponed: number; shipped: number }>(counts!);
  const q = by<{ uid: string; delivered: number; failed: number; cash: number }>(quality!);
  const f = by<{ uid: string; avgMin: number | null }>(first!);
  const acts = new Map<string, AgentAction[]>();
  for (const r of recent!.results as { uid: string; oid: string; number: string; fromStatus: string | null; toStatus: string; at: number }[]) {
    const l = acts.get(r.uid) ?? []; l.push({ orderId: r.oid, number: r.number, from: r.fromStatus, to: r.toStatus, at: r.at }); acts.set(r.uid, l);
  }
  const agents = (users!.results as { id: string; name: string; role: string; active: number }[]).map((u): AgentStats => {
    const k = c.get(u.id), ql = q.get(u.id);
    const handled = k?.handled ?? 0, confirmed = k?.confirmed ?? 0, delivered = ql?.delivered ?? 0, failed = ql?.failed ?? 0;
    return { userId: u.id, name: u.name, role: u.role, active: !!u.active, handled, confirmed, cancelled: k?.cancelled ?? 0, noAnswer: k?.noAnswer ?? 0, postponed: k?.postponed ?? 0, shipped: k?.shipped ?? 0,
      confirmRate: safeRate(confirmed, handled), avgResponseMin: f.get(u.id)?.avgMin ?? null, delivered, failed, deliveredRate: safeRate(delivered, delivered + failed), cashDelivered: ql?.cash ?? 0,
      perDay: handled / days, recent: acts.get(u.id) ?? [] };
  }).filter((a) => a.handled > 0).sort((a, b) => b.handled - a.handled);
  return { agents, orders: (total!.results[0] as { n: number }).n, confirmedTotal: agents.reduce((s, a) => s + a.confirmed, 0) };
}
