import { getSessionUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { toCsv } from "@/lib/csv";
import { toMajorString } from "@/lib/money";
import { parseI18n } from "@/lib/i18n-core";
import { getSettings } from "@/lib/settings";

export async function GET() {
  if (!(await getSessionUser())) return new Response("Unauthorized", { status: 401 });
  const cur = (await getSettings()).store.currency;
  const rows = (await getEnv().DB.prepare(`SELECT p.*, (SELECT slug FROM categories c WHERE c.id=p.category_id) AS cat, (SELECT key FROM product_images i WHERE i.product_id=p.id ORDER BY position LIMIT 1) AS image FROM products p ORDER BY p.created_at DESC LIMIT 10000`).all<Record<string, string | number | null>>()).results;
  const out: unknown[][] = [["slug", "name_en", "name_fr", "name_ar", "short_en", "short_fr", "short_ar", "description_en", "description_fr", "description_ar", "price", "compare_at", "stock", "sku", "category", "status", "featured", "image"]];
  for (const p of rows) {
    const n = parseI18n(p.name as string), s = parseI18n(p.short_desc as string), l = parseI18n(p.long_desc as string);
    out.push([p.slug, n.en, n.fr, n.ar, s.en, s.fr, s.ar, l.en, l.fr, l.ar, toMajorString(p.price as number, cur), p.compare_at ? toMajorString(p.compare_at as number, cur) : "", p.stock, p.sku, p.cat, p.status, p.featured ? 1 : 0, p.image]);
  }
  return new Response(toCsv(out), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="products.csv"', "Cache-Control": "no-store" } });
}
