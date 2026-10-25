import type { BundleRule } from "@/lib/pricing";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";

export type ProductCard = {
  id: string;
  slug: string;
  name: string; // JSON i18n
  price: number;
  compareAt: number | null;
  image: string | null;
  inStock: boolean;
  hasVariants: boolean;
  minPrice: number;
  rating: number | null;
  reviewCount: number;
  categoryId: string | null;
  featured: boolean;
  variantNames: string[];
  variantCount: number;
  specs: string;
};

const CARD_SELECT = `
  p.id, p.slug, p.name, p.price, p.compare_at AS compareAt, p.category_id AS categoryId, p.featured, p.specs AS specs,
  (SELECT key FROM product_images i WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image,
  (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variantCount,
  (SELECT COALESCE(SUM(v.stock),0) FROM product_variants v WHERE v.product_id = p.id) AS variantStock,
  (SELECT MIN(COALESCE(v.price, p.price)) FROM product_variants v WHERE v.product_id = p.id) AS variantMin,
  (SELECT GROUP_CONCAT(name, '|') FROM (SELECT name FROM product_variants WHERE product_id = p.id ORDER BY position LIMIT 6)) AS variantNames,
  p.stock AS stock, p.track_stock AS trackStock,
  (SELECT ROUND(AVG(r.rating),1) FROM reviews r WHERE r.product_id = p.id AND r.status='approved') AS rating,
  (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.status='approved') AS reviewCount`;

type Row = Record<string, unknown>;
function toCard(r: Row): ProductCard {
  const hasVariants = (r.variantCount as number) > 0;
  const inStock = !r.trackStock || (hasVariants ? (r.variantStock as number) > 0 : (r.stock as number) > 0);
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    price: r.price as number,
    compareAt: (r.compareAt as number | null) ?? null,
    image: (r.image as string | null) ?? null,
    inStock,
    hasVariants,
    minPrice: hasVariants ? ((r.variantMin as number | null) ?? (r.price as number)) : (r.price as number),
    rating: (r.rating as number | null) ?? null,
    reviewCount: (r.reviewCount as number) ?? 0,
    categoryId: (r.categoryId as string | null) ?? null,
    featured: !!r.featured,
    variantNames: r.variantNames ? String(r.variantNames).split("|") : [],
    variantCount: (r.variantCount as number) ?? 0,
    specs: (r.specs as string) ?? "{}",
  };
}

export type ListParams = {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "new" | "price_asc" | "price_desc" | "popular";
  page?: number;
  perPage?: number;
  featured?: boolean;
  bestsellers?: boolean;
  excludeId?: string;
};

export async function listProducts(p: ListParams = {}): Promise<{ items: ProductCard[]; total: number; page: number; perPage: number }> {
  await ensureSchema();
  const perPage = Math.min(p.perPage ?? 12, 48);
  const page = Math.max(1, p.page ?? 1);
  const where: string[] = ["p.status = 'published'"];
  const args: unknown[] = [];
  if (p.q) {
    where.push("(p.name LIKE ? ESCAPE '\\' OR p.sku LIKE ? ESCAPE '\\' OR p.short_desc LIKE ? ESCAPE '\\' OR p.specs LIKE ? ESCAPE '\\')");
    const like = `%${p.q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    args.push(like, like, like, like);
  }
  if (p.categoryId) (where.push("p.category_id = ?"), args.push(p.categoryId));
  if (p.minPrice != null) (where.push("p.price >= ?"), args.push(p.minPrice));
  if (p.maxPrice != null) (where.push("p.price <= ?"), args.push(p.maxPrice));
  if (p.featured) where.push("p.featured = 1");
  if (p.bestsellers) where.push("p.sold_count > 0 OR p.bestseller = 1");
  if (p.excludeId) (where.push("p.id != ?"), args.push(p.excludeId));
  if (p.inStock)
    where.push(
      "(p.track_stock = 0 OR (CASE WHEN EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id=p.id) THEN (SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id=p.id) ELSE p.stock END) > 0)",
    );
  const order = p.bestsellers
    ? "p.bestseller DESC, p.sold_count DESC, p.created_at DESC"
    : { new: "p.created_at DESC", price_asc: "p.price ASC", price_desc: "p.price DESC", popular: "p.sold_count DESC, p.created_at DESC" }[p.sort ?? "new"];
  const w = where.map((x) => `(${x})`).join(" AND ");
  const db = getEnv().DB;
  const [rows, count] = await db.batch([
    db.prepare(`SELECT ${CARD_SELECT} FROM products p WHERE ${w} ORDER BY ${order} LIMIT ? OFFSET ?`).bind(...args, perPage, (page - 1) * perPage),
    db.prepare(`SELECT COUNT(*) AS n FROM products p WHERE ${w}`).bind(...args),
  ]);
  return { items: (rows!.results as Row[]).map(toCard), total: ((count!.results as { n: number }[])[0]?.n ?? 0), page, perPage };
}

export type Category = { id: string; slug: string; name: string; image: string | null; count: number };

export async function listCategories(): Promise<Category[]> {
  await ensureSchema();
  const r = await getEnv()
    .DB.prepare(
      `SELECT c.id, c.slug, c.name, c.image,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status='published') AS count
       FROM categories c WHERE c.active = 1 ORDER BY c.position, c.name`,
    )
    .all<Category>();
  return r.results;
}

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string;
  longDesc: string;
  specs: string;
  price: number;
  compareAt: number | null;
  stock: number;
  trackStock: boolean;
  categoryId: string | null;
  sku: string | null;
  seoTitle: string;
  seoDesc: string;
  images: { id: string; key: string; alt: string | null }[];
  variants: { id: string; name: string; options: Record<string, string>; price: number; stock: number; sku: string | null }[];
  rating: number | null;
  reviewCount: number;
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  await ensureSchema();
  const db = getEnv().DB;
  const p = await db.prepare("SELECT * FROM products WHERE slug = ? AND status = 'published'").bind(slug).first<Row>();
  if (!p) return null;
  const [imgs, vars, rev] = await db.batch([
    db.prepare("SELECT id, key, alt FROM product_images WHERE product_id = ? ORDER BY position").bind(p.id),
    db.prepare("SELECT id, name, options, sku, price, stock FROM product_variants WHERE product_id = ? ORDER BY position").bind(p.id),
    db.prepare("SELECT ROUND(AVG(rating),1) AS rating, COUNT(*) AS n FROM reviews WHERE product_id = ? AND status='approved'").bind(p.id),
  ]);
  const r = (rev!.results as { rating: number | null; n: number }[])[0];
  return {
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    shortDesc: p.short_desc as string,
    longDesc: p.long_desc as string,
    specs: (p.specs as string) ?? "{}",
    price: p.price as number,
    compareAt: (p.compare_at as number | null) ?? null,
    stock: p.stock as number,
    trackStock: !!p.track_stock,
    categoryId: (p.category_id as string | null) ?? null,
    sku: (p.sku as string | null) ?? null,
    seoTitle: p.seo_title as string,
    seoDesc: p.seo_desc as string,
    images: imgs!.results as ProductDetail["images"],
    variants: (vars!.results as Row[]).map((v) => ({
      id: v.id as string,
      name: v.name as string,
      options: JSON.parse((v.options as string) || "{}"),
      sku: (v.sku as string | null) ?? null,
      price: (v.price as number | null) ?? (p.price as number),
      stock: v.stock as number,
    })),
    rating: r?.rating ?? null,
    reviewCount: r?.n ?? 0,
  };
}

export type ReviewRow = { id: string; name: string; city: string | null; rating: number; body: string; createdAt: number; productName?: string };

export async function listReviews(opts: { productId?: string; limit?: number }): Promise<ReviewRow[]> {
  await ensureSchema();
  const db = getEnv().DB;
  const q = opts.productId
    ? db.prepare("SELECT id, name, city, rating, body, created_at AS createdAt FROM reviews WHERE product_id = ? AND status='approved' ORDER BY created_at DESC LIMIT ?").bind(opts.productId, opts.limit ?? 20)
    : db.prepare("SELECT r.id, r.name, r.city, r.rating, r.body, r.created_at AS createdAt, p.name AS productName FROM reviews r LEFT JOIN products p ON p.id = r.product_id WHERE r.status='approved' ORDER BY r.rating DESC, r.created_at DESC LIMIT ?").bind(opts.limit ?? 6);
  return (await q.all<ReviewRow>()).results;
}

type BundleRow = { productId: string | null; minQty: number; percent: number; price: number | null; label: string | null; popular: number; basePrice: number | null };

/** Active bundle rules (percentage tiers and fixed-price offers), shaped as pricing-engine rules. */
export async function listBundles(productId?: string): Promise<BundleRule[]> {
  await ensureSchema();
  const db = getEnv().DB;
  const sel = "SELECT b.product_id AS productId, b.min_qty AS minQty, b.percent, b.price, b.label, b.popular, p.price AS basePrice FROM bundles b LEFT JOIN products p ON p.id = b.product_id WHERE b.active = 1";
  const r = productId
    ? await db.prepare(`${sel} AND (b.product_id IS NULL OR b.product_id = ?) ORDER BY b.min_qty`).bind(productId).all<BundleRow>()
    : await db.prepare(`${sel} ORDER BY b.min_qty`).all<BundleRow>();
  return r.results.map((x) => ({ productId: x.productId, minQty: x.minQty, percent: x.percent, price: x.price, basePrice: x.basePrice, label: x.label, popular: !!x.popular }));
}

export type CityOpt = { id: string; name: string; nameAr: string | null; region: string | null; fee: number | null; freeAbove: number | null; codAvailable: boolean; country: string };

export async function listCities(country?: string): Promise<CityOpt[]> {
  await ensureSchema();
  const db = getEnv().DB;
  const sqlText = `SELECT id, name, name_ar AS nameAr, region, fee, free_above AS freeAbove, cod_available AS codAvailable, country FROM cities WHERE active = 1 ${country ? "AND country = ?" : ""} ORDER BY position, name`;
  const r = await (country ? db.prepare(sqlText).bind(country) : db.prepare(sqlText)).all<Omit<CityOpt, "codAvailable"> & { codAvailable: number }>();
  return r.results.map((c) => ({ ...c, codAvailable: !!c.codAvailable }));
}

export async function getPage(slug: string) {
  await ensureSchema();
  return getEnv().DB.prepare("SELECT slug, title, body FROM pages WHERE slug = ? AND published = 1").bind(slug).first<{ slug: string; title: string; body: string }>();
}
export async function listPages() {
  await ensureSchema();
  return (await getEnv().DB.prepare("SELECT slug, title FROM pages WHERE published = 1 ORDER BY position").all<{ slug: string; title: string }>()).results;
}
