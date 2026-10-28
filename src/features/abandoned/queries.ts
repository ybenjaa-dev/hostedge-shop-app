import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { buildAbandonedWhere, isAbandonedStatus, type AbandonedFilters, type AbandonedExportRow } from "./lib";

export type AbandonedRow = {
  id: string; phone: string | null; name: string | null; city: string | null; address: string | null; productId: string | null; productName: string | null;
  status: string; note: string | null; contactedAt: number | null; contactedCount: number; convertedOrderId: string | null; lines: string | null;
  subtotal: number | null; total: number | null; currency: string | null; coupon: string | null; lang: string | null; source: string | null; device: string | null;
  extra: string | null; saves: number; lastSeenAt: number | null; createdAt: number; updatedAt: number;
};
const COLS = `id, phone, name, city, address, product_id AS productId, product_name AS productName, status, note, contacted_at AS contactedAt, contacted_count AS contactedCount,
  converted_order_id AS convertedOrderId, lines, subtotal, total, currency, coupon, lang, source, device, extra, saves, last_seen_at AS lastSeenAt, created_at AS createdAt, updated_at AS updatedAt`;
export const PER_PAGE = 25;

export async function listAbandoned(f: AbandonedFilters, page: number) {
  await ensureSchema();
  const db = getEnv().DB;
  const { where, args } = buildAbandonedWhere(f);
  const all = buildAbandonedWhere(f, true);
  const [rows, cnt, counts, cities] = await db.batch([
    db.prepare(`SELECT ${COLS} FROM abandoned_orders ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`).bind(...args, PER_PAGE, (page - 1) * PER_PAGE),
    db.prepare(`SELECT COUNT(*) AS n FROM abandoned_orders ${where}`).bind(...args),
    db.prepare(`SELECT status, COUNT(*) AS n FROM abandoned_orders ${all.where} GROUP BY status`).bind(...all.args),
    db.prepare("SELECT DISTINCT city FROM abandoned_orders WHERE city IS NOT NULL AND city != '' ORDER BY city LIMIT 300"),
  ]);
  const byStatus: Record<string, number> = {};
  for (const r of counts!.results as { status: string; n: number }[]) if (isAbandonedStatus(r.status)) byStatus[r.status] = r.n;
  return {
    rows: rows!.results as unknown as AbandonedRow[],
    total: (cnt!.results as { n: number }[])[0]?.n ?? 0,
    counts: byStatus,
    cities: (cities!.results as { city: string }[]).map((c) => c.city),
  };
}

export async function getAbandoned(id: string): Promise<AbandonedRow | null> {
  await ensureSchema();
  return getEnv().DB.prepare(`SELECT ${COLS} FROM abandoned_orders WHERE id = ?`).bind(id).first<AbandonedRow>();
}

export async function exportAbandoned(f: AbandonedFilters): Promise<AbandonedExportRow[]> {
  await ensureSchema();
  const { where, args } = buildAbandonedWhere(f);
  return (await getEnv().DB.prepare(`SELECT ${COLS} FROM abandoned_orders ${where} ORDER BY updated_at DESC LIMIT 20000`).bind(...args).all<AbandonedExportRow>()).results;
}

/** Number of checkouts nobody has followed up yet (for badges). */
export async function newAbandonedCount(): Promise<number> {
  await ensureSchema();
  return (await getEnv().DB.prepare("SELECT COUNT(*) AS n FROM abandoned_orders WHERE status = 'new'").first<{ n: number }>())?.n ?? 0;
}
