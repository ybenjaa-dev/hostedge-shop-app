"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { createSession, createUser, logActivity } from "@/lib/auth";
import { sha256Hex } from "@/lib/crypto";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import type { ActionState } from "@/features/admin/run";

const input = z.object({
  token: z.string().min(20).max(100),
  name: z.string().trim().min(2, "Enter your name").max(60),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  confirm: z.string(),
});

/** Public action (the invite token is the credential): creates the user, signs them in. */
export async function acceptInvite(_p: ActionState, form: FormData): Promise<ActionState> {
  await ensureSchema();
  const rl = await rateLimit(`invite:${await clientIp()}`, 15, 900);
  if (!rl.ok) return { error: "Too many attempts. Try again in a few minutes.", ts: Date.now() };
  const p = input.safeParse({ token: form.get("token"), name: form.get("name"), password: form.get("password"), confirm: form.get("confirm") });
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Invalid input", ts: Date.now() };
  if (p.data.password !== p.data.confirm) return { error: "Passwords do not match", ts: Date.now() };
  const db = getDb();
  const id = await sha256Hex(p.data.token);
  const inv = await db.select().from(schema.invites).where(eq(schema.invites.id, id)).get();
  if (!inv || inv.expiresAt < Date.now()) return { error: "This invitation link is invalid or has expired.", ts: Date.now() };
  let userId: string;
  try {
    userId = await createUser({ email: inv.email, name: p.data.name, password: p.data.password, role: inv.role });
  } catch {
    return { error: "An account with this email already exists.", ts: Date.now() };
  }
  await db.delete(schema.invites).where(eq(schema.invites.id, id));
  await createSession(userId);
  await logActivity({ id: userId, name: p.data.name }, "team.accept", "user", userId, { role: inv.role });
  redirect("/admin");
}
