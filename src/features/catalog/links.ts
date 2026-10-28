import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { parseI18n, type I18n } from "@/lib/i18n-core";

export type Companion = { id: string; slug: string; name: I18n; price: number; compareAt: number | null; image: string | null; variantId: string | null; variantName: string | null };
type Row = { id: string; slug: string; name: string; price: number; compare_at: number | null; stock: number; track_stock: number; image: string | null };

/** Products linked to `productId` ("together" = shown on the product page, "addon" = offered right after checkout) that can actually be bought now. */
export async function companions(productId: string, kind: "together" | "addon", limit = 3, exclude: string[] = []): Promise<Companion[]> {
  await ensureSchema();
  const db = getEnv().DB;
  const rows = await db.prepare(`SELECT p.id, p.slug, p.name, p.price, p.compare_at, p.stock, p.track_stock,
      (SELECT key FROM product_images i WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image
    FROM product_links l JOIN products p ON p.id = l.linked_id WHERE l.product_id = ? AND l.kind = ? AND p.status = 'published' ORDER BY l.position LIMIT 12`).bind(productId, kind).all<Row>();
  const list = rows.results.filter((r) => !exclude.includes(r.id));
  if (!list.length) return [];
  const vars = await db.prepare(`SELECT id, product_id AS pid, name, price, stock FROM product_variants WHERE product_id IN (${list.map(() => "?").join(",")}) ORDER BY position`).bind(...list.map((r) => r.id)).all<{ id: string; pid: string; name: string; price: number | null; stock: number }>();
  const out: Companion[] = [];
  for (const r of list) {
    const vs = vars.results.filter((v) => v.pid === r.id);
    let price = r.price, variantId: string | null = null, variantName: string | null = null;
    if (vs.length) {
      const v = vs.find((x) => !r.track_stock || x.stock > 0);
      if (!v) continue;
      variantId = v.id; variantName = v.name; price = v.price ?? r.price;
    } else if (r.track_stock && r.stock <= 0) continue;
    out.push({ id: r.id, slug: r.slug, name: parseI18n(r.name), price, compareAt: r.compare_at, image: r.image, variantId, variantName });
    if (out.length >= limit) break;
  }
  return out;
}

/** Ids chosen in the admin, for the product form. */
export async function linkedIds(productId: string): Promise<{ together: string[]; addon: string[] }> {
  await ensureSchema();
  const r = await getEnv().DB.prepare("SELECT linked_id AS id, kind FROM product_links WHERE product_id = ? ORDER BY position").bind(productId).all<{ id: string; kind: "together" | "addon" }>();
  return { together: r.results.filter((x) => x.kind === "together").map((x) => x.id), addon: r.results.filter((x) => x.kind === "addon").map((x) => x.id) };
}

/** Checkout-page `x` parameter ("productId.variantId,productId") → order lines for the companions the customer ticked. */
export async function resolveExtras(spec: string | undefined, mainId: string): Promise<{ productId: string; variantId: string | null; name: string; variantName: string | null; unitPrice: number; qty: number; image: string | null }[]> {
  if (!spec) return [];
  const db = getEnv().DB;
  const out = [];
  for (const part of spec.split(",").slice(0, 3)) {
    const [pid, vid] = part.split(".");
    if (!pid || pid === mainId || !/^[A-Za-z0-9_-]{1,40}$/.test(pid)) continue;
    const p = await db.prepare("SELECT id, name, price, stock, track_stock, (SELECT key FROM product_images i WHERE i.product_id = products.id ORDER BY position LIMIT 1) AS image FROM products WHERE id = ? AND status = 'published'").bind(pid).first<{ id: string; name: string; price: number; stock: number; track_stock: number; image: string | null }>();
    if (!p) continue;
    let price = p.price, variantName: string | null = null, variantId: string | null = null;
    if (vid && /^[A-Za-z0-9_-]{1,40}$/.test(vid)) {
      const v = await db.prepare("SELECT id, name, price, stock FROM product_variants WHERE id = ? AND product_id = ?").bind(vid, pid).first<{ id: string; name: string; price: number | null; stock: number }>();
      if (!v || (p.track_stock && v.stock <= 0)) continue;
      price = v.price ?? p.price; variantId = v.id; variantName = v.name;
    } else if (p.track_stock && p.stock <= 0) continue;
    out.push({ productId: p.id, variantId, name: p.name, variantName, unitPrice: price, qty: 1, image: p.image });
  }
  return out;
}
