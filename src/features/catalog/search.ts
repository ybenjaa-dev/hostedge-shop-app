import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { fold } from "@/lib/search-fold";

type Row = { id: string; name: string; short_desc: string; long_desc: string; specs: string; sku: string | null; cat: string | null };
const flat = (json: string) => { try { return Object.values(JSON.parse(json) as Record<string, string>).join(" "); } catch { return json ?? ""; } };
/** What a product is searched by: every language of the name & descriptions, the SKU and its category. */
export const searchTextOf = (r: Row) => fold([flat(r.name), flat(r.short_desc), flat(r.long_desc).replace(/<[^>]*>/g, " "), flat(r.specs), r.sku ?? "", flat(r.cat ?? "")].join(" ")).slice(0, 4000);

const SELECT = "SELECT p.id, p.name, p.short_desc, p.long_desc, p.specs, p.sku, (SELECT c.name FROM categories c WHERE c.id = p.category_id) AS cat FROM products p";

/** (Re)compute search text for these products — or, with no ids, for up to `limit` products that don't have it yet. */
export async function refreshSearchText(ids?: string[], limit = 400): Promise<number> {
  await ensureSchema();
  const db = getEnv().DB;
  const rows = ids?.length
    ? (await db.prepare(`${SELECT} WHERE p.id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all<Row>()).results
    : (await db.prepare(`${SELECT} WHERE p.search_text IS NULL LIMIT ?`).bind(limit).all<Row>()).results;
  for (let i = 0; i < rows.length; i += 40) await db.batch(rows.slice(i, i + 40).map((r) => db.prepare("UPDATE products SET search_text = ? WHERE id = ?").bind(searchTextOf(r), r.id)));
  return rows.length;
}

let lastCheck = 0;
/** Cheap guard run before searching: backfills products created before the index existed (a few hundred at a time). */
export async function ensureSearchIndex() {
  if (Date.now() - lastCheck < 30_000) return;
  lastCheck = Date.now();
  const n = await getEnv().DB.prepare("SELECT COUNT(*) AS n FROM products WHERE search_text IS NULL").first<{ n: number }>();
  if (n?.n) await refreshSearchText();
}

/** Category renames change the search text of its products. */
export async function refreshCategorySearch(categoryId: string) {
  const r = await getEnv().DB.prepare("SELECT id FROM products WHERE category_id = ?").bind(categoryId).all<{ id: string }>();
  if (r.results.length) await refreshSearchText(r.results.map((x) => x.id));
}
