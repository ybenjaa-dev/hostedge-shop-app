import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";

export type OrderFilters = { status?: string; city?: string; carrier?: string; from?: string; to?: string; q?: string; page?: number; perPage?: number };

export type OrderListRow = {
  id: string; number: string; status: string; name: string; phone: string; city: string; total: number; currency: string;
  carrierId: string | null; trackingNumber: string | null; attempts: number; createdAt: number; itemsCount: number; shipmentError: string | null;
};

const dayStart = (s: string) => { const d = Date.parse(`${s}T00:00:00Z`); return Number.isFinite(d) ? d : null; };

export function buildWhere(f: OrderFilters) {
  const w: string[] = [];
  const a: unknown[] = [];
  if (f.status) (w.push("o.status = ?"), a.push(f.status));
  if (f.city) (w.push("o.city_id = ?"), a.push(f.city));
  if (f.carrier) f.carrier === "none" ? w.push("o.carrier_id IS NULL") : (w.push("o.carrier_id = ?"), a.push(f.carrier));
  const from = f.from ? dayStart(f.from) : null;
  const to = f.to ? dayStart(f.to) : null;
  if (from) (w.push("o.created_at >= ?"), a.push(from));
  if (to) (w.push("o.created_at < ?"), a.push(to + 86400_000));
  if (f.q) {
    const q = f.q.trim();
    const digits = q.replace(/\D/g, "");
    const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    const parts = ["o.name LIKE ? ESCAPE '\\'", "o.number = ?", "o.tracking_number = ?"];
    a.push(like, q.replace(/^#/, ""), q);
    if (digits.length >= 4) (parts.push("o.phone LIKE ?"), a.push(`%${digits.replace(/^0+/, "")}%`));
    w.push(`(${parts.join(" OR ")})`);
  }
  return { where: w.length ? `WHERE ${w.join(" AND ")}` : "", args: a };
}

export async function listOrders(f: OrderFilters): Promise<{ rows: OrderListRow[]; total: number; perPage: number; page: number }> {
  await ensureSchema();
  const perPage = f.perPage ?? 25;
  const page = Math.max(1, f.page ?? 1);
  const { where, args } = buildWhere(f);
  const db = getEnv().DB;
  const [rows, cnt] = await db.batch([
    db.prepare(`SELECT o.id, o.number, o.status, o.name, o.phone, o.city, o.total, o.currency, o.carrier_id AS carrierId, o.tracking_number AS trackingNumber, o.attempts, o.created_at AS createdAt, o.shipment_error AS shipmentError,
      (SELECT COALESCE(SUM(qty),0) FROM order_items i WHERE i.order_id = o.id) AS itemsCount FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`).bind(...args, perPage, (page - 1) * perPage),
    db.prepare(`SELECT COUNT(*) AS n FROM orders o ${where}`).bind(...args),
  ]);
  return { rows: rows!.results as unknown as OrderListRow[], total: (cnt!.results as { n: number }[])[0]?.n ?? 0, perPage, page };
}

export async function statusCounts(): Promise<Record<string, number>> {
  const r = await getEnv().DB.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all<{ status: string; n: number }>();
  return Object.fromEntries(r.results.map((x) => [x.status, x.n]));
}

export async function getOrderFull(id: string) {
  await ensureSchema();
  const db = getEnv().DB;
  const o = await db.prepare("SELECT * FROM orders WHERE id = ? OR number = ?").bind(id, id).first<Record<string, string | number | null>>();
  if (!o) return null;
  const [items, history, notes, blocked, prior] = await db.batch([
    db.prepare("SELECT * FROM order_items WHERE order_id = ?").bind(o.id),
    db.prepare("SELECT * FROM order_history WHERE order_id = ? ORDER BY created_at DESC").bind(o.id),
    db.prepare("SELECT * FROM order_notes WHERE order_id = ? ORDER BY created_at DESC").bind(o.id),
    db.prepare("SELECT 1 AS x FROM blocked_phones WHERE phone = ?").bind(o.phone),
    db.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN status='delivered' THEN 1 ELSE 0 END) AS d, SUM(CASE WHEN status IN ('returned','return_received') THEN 1 ELSE 0 END) AS r FROM orders WHERE phone = ? AND id != ?").bind(o.phone, o.id),
  ]);
  const priorRow = (prior!.results as { n: number; d: number | null; r: number | null }[])[0];
  return {
    o,
    items: items!.results as { id: string; name: string; variant_name: string | null; sku: string | null; price: number; qty: number; image: string | null; product_id: string | null }[],
    history: history!.results as { id: string; from_status: string | null; to_status: string; user_name: string | null; note: string | null; created_at: number }[],
    notes: notes!.results as { id: string; user_name: string; body: string; created_at: number }[],
    blocked: blocked!.results.length > 0,
    prior: { n: priorRow?.n ?? 0, delivered: priorRow?.d ?? 0, returned: priorRow?.r ?? 0 },
  };
}

/** COD cash tracking aggregates (minor units). */
export async function cashSummary(f: { from?: string; to?: string }) {
  await ensureSchema();
  const from = f.from ? dayStart(f.from) : null;
  const to = f.to ? dayStart(f.to) : null;
  const w = ["1=1"]; const a: unknown[] = [];
  if (from) (w.push("created_at >= ?"), a.push(from));
  if (to) (w.push("created_at < ?"), a.push(to + 86400_000));
  const r = await getEnv().DB.prepare(
    `SELECT
      COALESCE(SUM(CASE WHEN status NOT IN ('cancelled','returned','return_received','refunded','new','pending_confirmation','no_answer','postponed') THEN total END),0) AS expected,
      COALESCE(SUM(CASE WHEN status = 'delivered' THEN cash_collected END),0) AS collected,
      COALESCE(SUM(CASE WHEN status = 'delivered' AND remitted = 0 THEN cash_collected END),0) AS pendingRemit,
      COALESCE(SUM(CASE WHEN status = 'delivered' AND remitted = 1 THEN cash_collected END),0) AS remitted,
      COALESCE(SUM(CASE WHEN status IN ('shipped','out_for_delivery','delivery_failed') THEN total END),0) AS inTransit,
      COALESCE(SUM(CASE WHEN status = 'delivered' THEN carrier_fee END),0) AS carrierFees,
      COALESCE(SUM(CASE WHEN status IN ('returned','return_received') THEN total END),0) AS returnedValue,
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) AS deliveredCount
     FROM orders WHERE ${w.join(" AND ")}`,
  ).bind(...a).first<Record<string, number>>();
  return r ?? {};
}
