import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";

export type AdminProductRow = { id: string; slug: string; name: string; sku: string | null; price: number; status: string; image: string | null; stock: number; variants: number; category: string | null; featured: number };

export async function listAdminProducts(f: { q?: string; status?: string; category?: string; page: number; perPage?: number }) {
  await ensureSchema();
  const perPage = f.perPage ?? 25;
  const w: string[] = []; const a: unknown[] = [];
  if (f.q) { const like = `%${f.q.replace(/[\\%_]/g, (m) => "\\" + m)}%`; w.push("(p.name LIKE ? ESCAPE '\\' OR p.sku LIKE ? ESCAPE '\\' OR p.slug LIKE ? ESCAPE '\\')"); a.push(like, like, like); }
  if (f.status) (w.push("p.status = ?"), a.push(f.status));
  if (f.category) (w.push("p.category_id = ?"), a.push(f.category));
  const where = w.length ? `WHERE ${w.join(" AND ")}` : "";
  const db = getEnv().DB;
  const [rows, cnt] = await db.batch([
    db.prepare(`SELECT p.id, p.slug, p.name, p.sku, p.price, p.status, p.featured,
      (SELECT key FROM product_images i WHERE i.product_id=p.id ORDER BY position LIMIT 1) AS image,
      CASE WHEN EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id=p.id) THEN (SELECT SUM(stock) FROM product_variants v WHERE v.product_id=p.id) ELSE p.stock END AS stock,
      (SELECT COUNT(*) FROM product_variants v WHERE v.product_id=p.id) AS variants,
      (SELECT name FROM categories c WHERE c.id=p.category_id) AS category
      FROM products p ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`).bind(...a, perPage, (f.page - 1) * perPage),
    db.prepare(`SELECT COUNT(*) AS n FROM products p ${where}`).bind(...a),
  ]);
  return { rows: rows!.results as unknown as AdminProductRow[], total: (cnt!.results as { n: number }[])[0]?.n ?? 0, perPage };
}

export async function getAdminProduct(id: string) {
  await ensureSchema();
  const db = getEnv().DB;
  const p = await db.prepare("SELECT * FROM products WHERE id = ?").bind(id).first<Record<string, string | number | null>>();
  if (!p) return null;
  const [imgs, vars, offs] = await db.batch([
    db.prepare("SELECT id, key, alt FROM product_images WHERE product_id = ? ORDER BY position").bind(id),
    db.prepare("SELECT id, name, options, sku, price, stock FROM product_variants WHERE product_id = ? ORDER BY position").bind(id),
    db.prepare("SELECT min_qty AS qty, price, label, popular, image FROM bundles WHERE product_id = ? AND price IS NOT NULL ORDER BY min_qty").bind(id),
  ]);
  return { p, images: imgs!.results as { id: string; key: string; alt: string | null }[], variants: vars!.results as { id: string; name: string; options: string; sku: string | null; price: number | null; stock: number }[], offers: offs!.results as { qty: number; price: number; label: string | null; popular: number; image: string | null }[] };
}

export async function listCategoryOptions() {
  await ensureSchema();
  return (await getEnv().DB.prepare("SELECT id, name, slug FROM categories ORDER BY position, name").all<{ id: string; name: string; slug: string }>()).results;
}
