import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { getLang } from "@/lib/i18n";
import { parseI18n, tr } from "@/lib/i18n-core";
import { likeEsc, tokens } from "@/lib/search-fold";
import { ensureSearchIndex } from "@/features/catalog/search";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";

/** Instant-search suggestions: a few products and categories matching what the visitor typed. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  const words = tokens(q);
  if (!words.length) return Response.json({ products: [], categories: [] });
  if (!(await rateLimit(`suggest:${await clientIp()}`, 90, 60)).ok) return Response.json({ products: [], categories: [] }, { status: 429 });
  await ensureSchema();
  await ensureSearchIndex();
  const [lang, s] = [await getLang(), await getSettings()];
  const db = getEnv().DB;
  const where = words.map(() => "p.search_text LIKE ? ESCAPE '\\'").join(" AND ");
  const args = words.map((w) => `%${likeEsc(w)}%`);
  const first = likeEsc(words[0]!);
  const [prods, cats] = await db.batch([
    db.prepare(`SELECT p.slug, p.name, p.price, p.compare_at AS compareAt,
        (SELECT key FROM product_images i WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image,
        (SELECT MIN(COALESCE(v.price, p.price)) FROM product_variants v WHERE v.product_id = p.id) AS vmin
      FROM products p WHERE p.status = 'published' AND ${where}
      ORDER BY (p.search_text LIKE ? ESCAPE '\\') DESC, p.featured DESC, p.sold_count DESC LIMIT 6`).bind(...args, `${first}%`),
    db.prepare("SELECT slug, name FROM categories WHERE active = 1 AND (" + words.map(() => "name LIKE ? ESCAPE '\\'").join(" AND ") + ") LIMIT 3").bind(...words.map((w) => `%${likeEsc(w)}%`)),
  ]);
  const cur = s.store.currency;
  return Response.json({
    products: (prods!.results as { slug: string; name: string; price: number; compareAt: number | null; image: string | null; vmin: number | null }[]).map((p) => ({
      slug: p.slug, name: tr(parseI18n(p.name), lang), image: p.image, price: formatMoney(p.vmin ?? p.price, cur, lang), was: p.compareAt && p.compareAt > p.price ? formatMoney(p.compareAt, cur, lang) : null,
    })),
    // category names are matched in their stored (JSON) form, which carries every language
    categories: (cats!.results as { slug: string; name: string }[]).map((c) => ({ slug: c.slug, name: tr(parseI18n(c.name), lang) })),
  }, { headers: { "Cache-Control": "private, max-age=30" } });
}
