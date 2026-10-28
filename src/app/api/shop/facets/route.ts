import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";
import { likeEsc, tokens } from "@/lib/search-fold";
import { decimalsOf } from "@/lib/money";
import { ensureSearchIndex } from "@/features/catalog/search";

/** What the filter panel can offer for the current search/category: price range and the variant options (Size, Color…) with counts. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!(await rateLimit(`facets:${await clientIp()}`, 60, 60)).ok) return Response.json({ price: null, options: [] }, { status: 429 });
  await ensureSchema();
  await ensureSearchIndex();
  const db = getEnv().DB;
  const where: string[] = ["p.status = 'published'"];
  const args: unknown[] = [];
  const cat = u.searchParams.get("category")?.slice(0, 80);
  if (cat) { where.push("p.category_id = (SELECT id FROM categories WHERE slug = ?)"); args.push(cat); }
  for (const w of tokens(u.searchParams.get("q") ?? "")) { where.push("p.search_text LIKE ? ESCAPE '\\'"); args.push(`%${likeEsc(w)}%`); }
  const w = where.join(" AND ");
  const [price, opts] = await db.batch([
    db.prepare(`SELECT MIN(p.price) AS min, MAX(p.price) AS max FROM products p WHERE ${w}`).bind(...args),
    db.prepare(`SELECT je.key AS k, je.value AS v, COUNT(DISTINCT v.product_id) AS n FROM product_variants v JOIN products p ON p.id = v.product_id, json_each(v.options) je WHERE ${w} GROUP BY je.key, je.value ORDER BY je.key, n DESC LIMIT 120`).bind(...args),
  ]);
  const pr = price!.results[0] as { min: number | null; max: number | null } | undefined;
  const byKey = new Map<string, { v: string; n: number }[]>();
  for (const r of opts!.results as { k: string; v: string; n: number }[]) {
    const l = byKey.get(r.k) ?? [];
    if (l.length < 14) l.push({ v: String(r.v), n: r.n });
    byKey.set(r.k, l);
  }
  const s = await getSettings();
  return Response.json({
    currency: s.store.currency,
    // major units (what the min/max URL params use): 12500 minor → 125
    price: pr?.min != null && pr.max != null ? { min: Math.floor(pr.min / 10 ** decimalsOf(s.store.currency)), max: Math.ceil(pr.max / 10 ** decimalsOf(s.store.currency)) } : null,
    options: [...byKey.entries()].slice(0, 4).map(([name, values]) => ({ name, values })),
  }, { headers: { "Cache-Control": "private, max-age=60" } });
}
