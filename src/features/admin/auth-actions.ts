"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { destroySession, login, getSessionUser, logActivity } from "@/lib/auth";
import type { ActionState } from "./run";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) });

export async function loginAction(_p: ActionState, form: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const r = await login(parsed.data.email, parsed.data.password);
  if (!r.ok) return { error: r.error };
  const u = await getSessionUser();
  if (u) await logActivity(u, "auth.login");
  redirect("/admin");
}

export async function logoutAction() {
  const u = await getSessionUser();
  if (u) await logActivity(u, "auth.logout");
  await destroySession();
  redirect("/admin/login");
}
