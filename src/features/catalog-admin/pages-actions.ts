"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { run, audit, fd, fdI18n, type ActionState } from "@/features/admin/run";
import { newId } from "@/lib/id";
import { parse, refresh, fail } from "@/features/settings/lib";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function savePage(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const title = fdI18n(form, "title"), body = fdI18n(form, "body");
    if (!Object.keys(title).length) return fail("Add a title in at least one language");
    const p = parse(
      z.object({
        id: z.string().max(40),
        slug: z.string().min(1, "Slug is required").max(60).regex(slugRe, "Slug: lowercase letters, numbers and hyphens only"),
        position: z.number().int().min(0).max(9999),
      }),
      { id: fd(form, "id"), slug: fd(form, "slug").toLowerCase(), position: Number(fd(form, "position") || 0) },
    );
    if (!p.ok) return p.state;
    for (const t of Object.values(title)) if (t.length > 160) return fail("Title is too long (160 max)");
    for (const t of Object.values(body)) if (t.length > 30000) return fail("Body is too long");
    const d = p.data;
    const values = { slug: d.slug, title: JSON.stringify(title), body: JSON.stringify(body), published: form.get("published") === "1", position: d.position };
    const db = getDb();
    if (d.id) {
      await db.update(schema.pages).set(values).where(eq(schema.pages.id, d.id));
      await audit(user, "page.update", "page", d.id);
      refresh();
      return { message: "Page saved" };
    }
    const id = newId();
    await db.insert(schema.pages).values({ id, ...values });
    await audit(user, "page.create", "page", id);
    refresh();
    redirect(`/admin/pages/${id}`);
  });
}

export async function deletePage(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing page");
    await getDb().delete(schema.pages).where(eq(schema.pages.id, id));
    await audit(user, "page.delete", "page", id);
    refresh();
    return { message: "Page deleted" };
  });
}
