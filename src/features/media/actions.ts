"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { deleteMedia } from "./server";

export async function updateMediaAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async () => {
    const id = fd(form, "id");
    const name = fd(form, "name").slice(0, 160);
    if (!id || !name) return { ok: false, error: "Enter a file name." };
    await getEnv().DB.prepare("UPDATE media SET name = ?, alt = ? WHERE id = ?").bind(name, fd(form, "alt").slice(0, 300) || null, id).run();
    return { message: "Saved" };
  });
}

const ids = z.array(z.string().min(1).max(40)).min(1).max(100);
/** Delete files from the library. Pictures still used by a product, category, offer or setting are kept unless `force` is set. */
export async function deleteMediaAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const list = ids.parse(JSON.parse(fd(form, "ids") || "[]"));
    const r = await deleteMedia(list, fd(form, "force") === "1");
    await audit(user, "media.delete", "media", `${r.deleted} file(s)`);
    revalidatePath("/", "layout");
    if (r.blocked.length && !r.deleted) return { ok: false, error: `Still in use: ${r.blocked.slice(0, 3).map((b) => b.name).join(", ")}${r.blocked.length > 3 ? "…" : ""}. Remove it from where it is used first.` };
    return { message: `${r.deleted} deleted${r.blocked.length ? ` · ${r.blocked.length} kept because they are in use` : ""}` };
  });
}
