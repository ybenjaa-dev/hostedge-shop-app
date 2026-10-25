"use server";
import { z } from "zod";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { run, audit, fd, fdI18n, type ActionState } from "@/features/admin/run";
import { newId, slugify } from "@/lib/id";
import { parse, refresh, fail } from "@/features/settings/lib";

export async function saveCategory(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const name = fdI18n(form, "name");
    if (!Object.keys(name).length) return fail("Add a name in at least one language");
    for (const n of Object.values(name)) if (n.length > 80) return fail("Name is too long (80 max)");
    const rawSlug = fd(form, "slug").toLowerCase() || slugify(name.en || name.fr || name.ar || "");
    const p = parse(
      z.object({
        id: z.string().max(40),
        slug: z.string().min(1).max(80).regex(/^[a-z0-9؀-ۿ]+(?:-[a-z0-9؀-ۿ]+)*$/, "Slug: letters, numbers and hyphens only"),
        image: z.string().max(300),
        position: z.number().int().min(0).max(9999),
      }),
      { id: fd(form, "id"), slug: rawSlug, image: fd(form, "image"), position: Number(fd(form, "position") || 0) },
    );
    if (!p.ok) return p.state;
    const d = p.data;
    const values = { slug: d.slug, name: JSON.stringify(name), image: d.image || null, position: d.position, active: form.get("active") === "1" };
    const db = getDb();
    if (d.id) {
      await db.update(schema.categories).set(values).where(eq(schema.categories.id, d.id));
      await audit(user, "category.update", "category", d.id);
    } else {
      const id = newId();
      await db.insert(schema.categories).values({ id, ...values });
      await audit(user, "category.create", "category", id);
    }
    refresh();
    return { message: d.id ? "Category saved" : "Category created" };
  });
}

/** Delete a category. If it has products they must be reassigned (to another category or to none). */
export async function deleteCategory(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = fd(form, "id");
    const reassign = fd(form, "reassign"); // "" = none, otherwise category id
    if (!id) return fail("Missing category");
    const db = getDb();
    const cnt = await db.select({ n: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.categoryId, id)).get();
    if ((cnt?.n ?? 0) > 0) {
      if (fd(form, "mode") !== "reassign") return fail("This category has products. Choose where to move them first.");
      if (reassign) {
        if (reassign === id) return fail("Pick a different category");
        const t = await db.select({ id: schema.categories.id }).from(schema.categories).where(and(eq(schema.categories.id, reassign), ne(schema.categories.id, id))).get();
        if (!t) return fail("Target category not found");
      }
      await db.update(schema.products).set({ categoryId: reassign || null }).where(eq(schema.products.categoryId, id));
    }
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    await audit(user, "category.delete", "category", id, { moved: cnt?.n ?? 0, to: reassign || null });
    refresh();
    return { message: "Category deleted" };
  });
}
