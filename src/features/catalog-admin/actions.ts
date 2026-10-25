"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { newId, slugify } from "@/lib/id";
import { run, audit, fd, fdI18n, type ActionState } from "@/features/admin/run";
import { getSettings } from "@/lib/settings";
import { toMinor } from "@/lib/money";
import { isOfferTemplate } from "@/lib/offer-templates";
import { parseCsv } from "@/lib/csv";
import { deleteFile } from "@/lib/storage";

const money = (v: string, cur: string) => { const n = toMinor(v || "0", cur); if (!Number.isFinite(n) || n < 0) throw new Error("Invalid amount"); return n; };

const variantSchema = z.array(z.object({
  id: z.string().max(40).optional(), name: z.string().trim().min(1).max(80), options: z.record(z.string().max(40), z.string().max(40)).default({}),
  sku: z.string().trim().max(60).optional().nullable(), price: z.string().max(20).optional().nullable(), stock: z.coerce.number().int().min(0).max(1_000_000),
})).max(100);
const offerSchema = z.array(z.object({
  qty: z.coerce.number().int().min(2).max(1000), price: z.string().trim().min(1).max(20), label: z.string().trim().max(30).optional().nullable(), popular: z.boolean().optional(), image: z.union([z.literal(""), z.string().regex(/^uploads\/[A-Za-z0-9._-]{4,120}$/)]).optional().nullable(),
})).max(6);
const imageSchema = z.array(z.object({ key: z.string().min(1).max(200), alt: z.string().max(200).optional().nullable() })).max(20);

export async function saveProductAction(_p: ActionState, form: FormData): Promise<ActionState> {
  let createdId: string | null = null;
  const res = await run("staff", async (user) => {
    const s = await getSettings();
    const cur = s.store.currency;
    const db = getEnv().DB;
    const id = fd(form, "id") || null;
    const name = fdI18n(form, "name");
    if (!Object.values(name).some(Boolean)) return { ok: false, error: "Enter a product name in at least one language." };
    const slug = slugify(fd(form, "slug") || name.en || name.fr || name.ar || "product");
    const price = money(fd(form, "price"), cur);
    const cmp = fd(form, "compareAt") ? money(fd(form, "compareAt"), cur) : null;
    const variants = variantSchema.parse(JSON.parse(fd(form, "variants") || "[]"));
    const images = imageSchema.parse(JSON.parse(fd(form, "images") || "[]"));
    const offers = offerSchema.parse(JSON.parse(fd(form, "offers") || "[]"));
    if (new Set(offers.map((o) => o.qty)).size !== offers.length) return { ok: false, error: "Each quantity offer needs a different quantity." };
    for (const o of offers) if (money(o.price, cur) >= price * o.qty) return { ok: false, error: `The ${o.qty}-unit offer must cost less than ${o.qty} × the normal price.` };
    const now = Date.now();
    const status = fd(form, "status") === "published" ? "published" : "draft";
    const pid = id ?? newId();
    const vals = [slug, JSON.stringify(name), JSON.stringify(fdI18n(form, "short")), JSON.stringify(fdI18n(form, "long")), fd(form, "categoryId") || null, fd(form, "sku") || null, price, cmp, Math.max(0, parseInt(fd(form, "stock") || "0", 10) || 0), form.get("trackStock") ? 1 : 0, status, form.get("featured") ? 1 : 0, form.get("bestseller") ? 1 : 0, JSON.stringify(fdI18n(form, "seoTitle")), JSON.stringify(fdI18n(form, "seoDesc")), JSON.stringify(fdI18n(form, "specs")), isOfferTemplate(fd(form, "offerTemplate")) ? fd(form, "offerTemplate") : null];
    const stmts: D1PreparedStatement[] = [];
    if (id) stmts.push(db.prepare("UPDATE products SET slug=?, name=?, short_desc=?, long_desc=?, category_id=?, sku=?, price=?, compare_at=?, stock=?, track_stock=?, status=?, featured=?, bestseller=?, seo_title=?, seo_desc=?, specs=?, offer_template=?, updated_at=? WHERE id=?").bind(...vals, now, id));
    else stmts.push(db.prepare("INSERT INTO products (slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, seo_title, seo_desc, specs, offer_template, id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(...vals, pid, now, now));
    // images: replace set preserving order
    stmts.push(db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(pid));
    images.forEach((im, i) => stmts.push(db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,?)").bind(newId(), pid, im.key, im.alt ?? null, i)));
    // variants: upsert + remove the ones dropped
    const keep = variants.map((v) => v.id).filter(Boolean) as string[];
    stmts.push(keep.length ? db.prepare(`DELETE FROM product_variants WHERE product_id = ? AND id NOT IN (${keep.map(() => "?").join(",")})`).bind(pid, ...keep) : db.prepare("DELETE FROM product_variants WHERE product_id = ?").bind(pid));
    variants.forEach((v, i) => {
      const vp = v.price ? money(v.price, cur) : null;
      if (v.id) stmts.push(db.prepare("UPDATE product_variants SET name=?, options=?, sku=?, price=?, stock=?, position=? WHERE id=? AND product_id=?").bind(v.name, JSON.stringify(v.options), v.sku || null, vp, v.stock, i, v.id, pid));
      else stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), pid, v.name, JSON.stringify(v.options), v.sku || null, vp, v.stock, i));
    });
    // quantity offers: replace this product's fixed-price bundles
    stmts.push(db.prepare("DELETE FROM bundles WHERE product_id = ? AND price IS NOT NULL").bind(pid));
    offers.forEach((o) => stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, image, active) VALUES (?,?,?,?,?,?,?,?,1)").bind(newId(), pid, o.qty, 0, money(o.price, cur), o.label || null, o.popular ? 1 : 0, o.image || null)));
    await db.batch(stmts);
    await audit(user, id ? "product.update" : "product.create", "product", pid);
    revalidatePath("/", "layout");
    if (!id) createdId = pid;
    return { message: "Product saved", id: pid };
  });
  if (createdId && res?.ok) redirect(`/admin/products/${createdId}`);
  return res;
}

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  op: z.enum(["publish", "draft", "delete", "category", "price_pct", "price_set", "stock_add", "stock_set", "featured_on", "featured_off"]),
  value: z.string().max(40).optional(),
});

export async function bulkProductsAction(raw: unknown): Promise<ActionState> {
  return run("staff", async (user) => {
    const { ids, op, value = "" } = bulkSchema.parse(raw);
    const db = getEnv().DB;
    const s = await getSettings();
    const ph = ids.map(() => "?").join(",");
    const now = Date.now();
    switch (op) {
      case "publish": case "draft": await db.prepare(`UPDATE products SET status=?, updated_at=? WHERE id IN (${ph})`).bind(op === "publish" ? "published" : "draft", now, ...ids).run(); break;
      case "featured_on": case "featured_off": await db.prepare(`UPDATE products SET featured=?, updated_at=? WHERE id IN (${ph})`).bind(op === "featured_on" ? 1 : 0, now, ...ids).run(); break;
      case "category": await db.prepare(`UPDATE products SET category_id=?, updated_at=? WHERE id IN (${ph})`).bind(value || null, now, ...ids).run(); break;
      case "price_pct": { const pct = Number(value); if (!Number.isFinite(pct) || pct < -90 || pct > 500) throw new Error("Invalid percentage"); await db.prepare(`UPDATE products SET price = MAX(0, CAST(ROUND(price * (100 + ?) / 100.0) AS INTEGER)), updated_at=? WHERE id IN (${ph})`).bind(pct, now, ...ids).run(); break; }
      case "price_set": await db.prepare(`UPDATE products SET price=?, updated_at=? WHERE id IN (${ph})`).bind(money(value, s.store.currency), now, ...ids).run(); break;
      case "stock_add": { const n = parseInt(value, 10); if (!Number.isFinite(n)) throw new Error("Invalid number"); await db.prepare(`UPDATE products SET stock = MAX(0, stock + ?), updated_at=? WHERE id IN (${ph})`).bind(n, now, ...ids).run(); break; }
      case "stock_set": { const n = parseInt(value, 10); if (!Number.isFinite(n) || n < 0) throw new Error("Invalid number"); await db.prepare(`UPDATE products SET stock = ?, updated_at=? WHERE id IN (${ph})`).bind(n, now, ...ids).run(); break; }
      case "delete": {
        const imgs = (await db.prepare(`SELECT key FROM product_images WHERE product_id IN (${ph})`).bind(...ids).all<{ key: string }>()).results;
        await db.batch([db.prepare(`DELETE FROM product_images WHERE product_id IN (${ph})`).bind(...ids), db.prepare(`DELETE FROM product_variants WHERE product_id IN (${ph})`).bind(...ids), db.prepare(`DELETE FROM products WHERE id IN (${ph})`).bind(...ids)]);
        await Promise.all(imgs.map((i) => deleteFile(i.key).catch(() => {})));
        break;
      }
    }
    await audit(user, `product.bulk.${op}`, "product", undefined, { count: ids.length });
    revalidatePath("/", "layout");
    return { message: `${ids.length} product(s) updated` };
  });
}

/** Upsert products by slug from a CSV (see /admin/products/import for the template). */
export async function importProductsAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const file = form.get("file");
    const text = file instanceof File && file.size ? await file.text() : fd(form, "csv");
    if (!text) return { ok: false, error: "Choose a CSV file or paste CSV text." };
    if (text.length > 2_000_000) return { ok: false, error: "File too large (max 2 MB)." };
    const rows = parseCsv(text);
    const head = rows.shift()?.map((h) => h.trim().toLowerCase()) ?? [];
    if (!head.includes("slug") && !head.includes("name_en") && !head.includes("name_fr")) return { ok: false, error: "Header row must contain at least slug or name_en." };
    const idx = (k: string) => head.indexOf(k);
    const get = (r: string[], k: string) => (idx(k) >= 0 ? (r[idx(k)] ?? "").trim() : "");
    const s = await getSettings();
    const db = getEnv().DB;
    const cats = new Map((await db.prepare("SELECT id, slug FROM categories").all<{ id: string; slug: string }>()).results.map((c) => [c.slug, c.id]));
    let created = 0, updated = 0;
    const errors: string[] = [];
    for (const [n, r] of rows.entries()) {
      try {
        const name = { en: get(r, "name_en"), fr: get(r, "name_fr"), ar: get(r, "name_ar") };
        const slug = slugify(get(r, "slug") || name.en || name.fr || name.ar);
        if (!Object.values(name).some(Boolean)) throw new Error("missing name");
        const price = money(get(r, "price"), s.store.currency);
        const cmpS = get(r, "compare_at");
        const cmp = cmpS ? money(cmpS, s.store.currency) : null;
        const pick = (p: string) => JSON.stringify(Object.fromEntries((["en", "fr", "ar"] as const).map((l) => [l, get(r, `${p}_${l}`)]).filter(([, v]) => v)));
        const existing = await db.prepare("SELECT id FROM products WHERE slug = ?").bind(slug).first<{ id: string }>();
        const catId = cats.get(get(r, "category")) ?? null;
        const status = get(r, "status") === "published" ? "published" : "draft";
        const now = Date.now();
        const vals = [JSON.stringify(Object.fromEntries(Object.entries(name).filter(([, v]) => v))), pick("short"), pick("description"), catId, get(r, "sku") || null, price, cmp, Math.max(0, parseInt(get(r, "stock") || "0", 10) || 0), status, get(r, "featured") === "1" ? 1 : 0];
        if (existing) {
          await db.prepare("UPDATE products SET name=?, short_desc=?, long_desc=?, category_id=?, sku=?, price=?, compare_at=?, stock=?, status=?, featured=?, updated_at=? WHERE id=?").bind(...vals, now, existing.id).run();
          updated++;
        } else {
          const id = newId();
          await db.batch([
            db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, status, featured, track_stock, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)").bind(id, slug, ...vals, now, now),
            ...(get(r, "image") ? [db.prepare("INSERT INTO product_images (id, product_id, key, position) VALUES (?,?,?,0)").bind(newId(), id, get(r, "image"))] : []),
          ]);
          created++;
        }
      } catch (e) { errors.push(`Row ${n + 2}: ${e instanceof Error ? e.message : "invalid"}`); }
    }
    await audit(user, "product.import", "product", undefined, { created, updated, errors: errors.length });
    revalidatePath("/", "layout");
    return { message: `Imported: ${created} created, ${updated} updated${errors.length ? `, ${errors.length} skipped (${errors.slice(0, 3).join("; ")})` : ""}` };
  });
}
