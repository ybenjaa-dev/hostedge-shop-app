"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { newId } from "@/lib/id";
import { run, audit, fd, type ActionState } from "@/features/admin/run";

const KEY = /^uploads\/[A-Za-z0-9._-]{4,120}$/;
const itemsSchema = z.array(z.object({ productId: z.string().min(1).max(40), key: z.string().regex(KEY), mode: z.enum(["main", "add"]) })).min(1).max(300);

/** Attach uploaded photos to products. "main" puts the photo first (and drops the placeholder illustration); "add" appends. */
export async function attachProductPhotos(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("products.edit", async (user) => {
    const items = itemsSchema.parse(JSON.parse(fd(form, "items") || "[]"));
    const db = getEnv().DB;
    let n = 0;
    for (const it of items) {
      const exists = await db.prepare("SELECT 1 AS x FROM products WHERE id = ?").bind(it.productId).first();
      if (!exists) continue;
      const cur = await db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN key NOT LIKE 'uploads/sample-%' THEN 1 ELSE 0 END) AS real, COALESCE(MAX(position), -1) AS maxpos FROM product_images WHERE product_id = ?").bind(it.productId).first<{ total: number; real: number | null; maxpos: number }>();
      const onlySample = !cur || (cur.real ?? 0) === 0;
      const stmts: D1PreparedStatement[] = [];
      if (it.mode === "main" || onlySample) {
        if (onlySample) stmts.push(db.prepare("DELETE FROM product_images WHERE product_id = ? AND key LIKE 'uploads/sample-%'").bind(it.productId));
        stmts.push(db.prepare("UPDATE product_images SET position = position + 1 WHERE product_id = ?").bind(it.productId));
        stmts.push(db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,NULL,0)").bind(newId(), it.productId, it.key));
      } else {
        stmts.push(db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,NULL,?)").bind(newId(), it.productId, it.key, (cur?.maxpos ?? -1) + 1));
      }
      await db.batch(stmts);
      n++;
    }
    await audit(user, "photos.attach", "product", `${n} photo(s)`);
    revalidatePath("/", "layout");
    return { message: `${n} photo${n === 1 ? "" : "s"} added` };
  });
}

export async function setCategoryPhoto(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("categories.manage", async (user) => {
    const id = fd(form, "id");
    const key = fd(form, "key");
    if (!id || !KEY.test(key)) return { ok: false, error: "Invalid image." };
    await getEnv().DB.prepare("UPDATE categories SET image = ? WHERE id = ?").bind(key, id).run();
    await audit(user, "photos.category", "category", id);
    revalidatePath("/", "layout");
    return { message: "Category photo updated" };
  });
}

/** Owner only: delete the sample catalogue so the store starts clean. Products that already have orders are only hidden (draft). */
export async function removeSampleData(_p: ActionState, _form: FormData): Promise<ActionState> {
  void _form;
  return run("owner", async (user) => {
    const db = getEnv().DB;
    const prods = await db.prepare(`SELECT p.id FROM products p
      WHERE (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) > 0
        AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id AND i.key NOT LIKE 'uploads/sample-%')`).all<{ id: string }>();
    let deleted = 0, hidden = 0;
    for (const { id } of prods.results) {
      const used = await db.prepare("SELECT 1 AS x FROM order_items WHERE product_id = ? LIMIT 1").bind(id).first();
      if (used) { await db.prepare("UPDATE products SET status = 'draft' WHERE id = ?").bind(id).run(); hidden++; continue; }
      await db.batch([
        db.prepare("DELETE FROM product_images WHERE product_id = ?").bind(id),
        db.prepare("DELETE FROM product_variants WHERE product_id = ?").bind(id),
        db.prepare("DELETE FROM reviews WHERE product_id = ?").bind(id),
        db.prepare("DELETE FROM bundles WHERE product_id = ?").bind(id),
        db.prepare("DELETE FROM products WHERE id = ?").bind(id),
      ]);
      deleted++;
    }
    const cats = await db.prepare("DELETE FROM categories WHERE image LIKE 'uploads/sample-%' AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_id = categories.id)").run();
    await audit(user, "photos.removeSample", "store", `${deleted} deleted, ${hidden} hidden`);
    revalidatePath("/", "layout");
    return { message: `Removed ${deleted} sample product${deleted === 1 ? "" : "s"}${hidden ? ` (${hidden} with orders were hidden instead)` : ""} and ${cats.meta?.changes ?? 0} categories.` };
  });
}
