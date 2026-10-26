"use server";
import { z } from "zod";
import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { hashPassword, randomToken, sha256Hex, verifyPassword } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { ROLES, ROLE_INFO, isRole } from "@/lib/permissions";
import { getEnv } from "@/lib/env";
import { parse, fail } from "@/features/settings/lib";

const INVITE_TTL = 72 * 3600_000;
const done = () => revalidatePath("/admin/team");

async function activeOwners(excludeId?: string) {
  const r = await getDb().select({ n: sql<number>`count(*)` }).from(schema.users)
    .where(and(eq(schema.users.role, "owner"), eq(schema.users.active, true), excludeId ? ne(schema.users.id, excludeId) : undefined)).get();
  return r?.n ?? 0;
}

/** Creates an invite and returns the one-time link path. Only a hash of the token is stored. */
export async function inviteUser(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const p = parse(z.object({ email: z.email("Enter a valid email").max(120), role: z.enum(ROLES) }), { email: fd(form, "email").toLowerCase(), role: fd(form, "role") });
    if (!p.ok) return p.state;
    const db = getDb();
    const exists = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, p.data.email)).get();
    if (exists) return fail("A user with this email already exists.");
    await db.delete(schema.invites).where(eq(schema.invites.email, p.data.email));
    const token = randomToken(32);
    await db.insert(schema.invites).values({ id: await sha256Hex(token), email: p.data.email, role: p.data.role, expiresAt: Date.now() + INVITE_TTL });
    await audit(user, "team.invite", "invite", p.data.email, { role: p.data.role });
    done();
    return { message: "Invite created — copy the link now, it is shown only once", fields: { path: `/accept-invite/${token}`, email: p.data.email } };
  });
}

export async function revokeInvite(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing invite");
    await getDb().delete(schema.invites).where(eq(schema.invites.id, id));
    await audit(user, "team.invite_revoke", "invite", id.slice(0, 8));
    done();
    return { message: "Invite revoked" };
  });
}

export async function setUserActive(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const id = fd(form, "id"), active = fd(form, "active") === "1";
    const db = getDb();
    const target = await db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!target) return fail("User not found");
    if (!active) {
      if (target.id === user.id) return fail("You cannot deactivate your own account.");
      if (target.role === "owner" && target.active && (await activeOwners(target.id)) < 1) return fail("You cannot deactivate the last owner.");
    }
    await db.update(schema.users).set({ active }).where(eq(schema.users.id, id));
    if (!active) await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
    await audit(user, active ? "team.reactivate" : "team.deactivate", "user", id);
    done();
    return { message: active ? "User reactivated" : "User deactivated and signed out" };
  });
}

export async function setUserRole(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const id = fd(form, "id"), role = fd(form, "role");
    if (!isRole(role)) return fail("Invalid role");
    const db = getDb();
    const target = await db.select().from(schema.users).where(eq(schema.users.id, id)).get();
    if (!target) return fail("User not found");
    if (target.role === role) return { message: "No change" };
    if (role !== "owner" && target.role === "owner" && target.active && (await activeOwners(target.id)) < 1) return fail("You cannot demote the last owner.");
    await db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
    await audit(user, "team.role", "user", id, { role });
    done();
    return { message: `Role changed to ${ROLE_INFO[role].label}` };
  });
}

/** Any signed-in user may change their own password. */
export async function changeOwnPassword(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const p = parse(z.object({ current: z.string().min(1, "Enter your current password").max(200), next: z.string().min(8, "New password must be at least 8 characters").max(200), confirm: z.string() }),
      { current: form.get("current"), next: form.get("next"), confirm: form.get("confirm") });
    if (!p.ok) return p.state;
    if (p.data.next !== p.data.confirm) return fail("Passwords do not match");
    const db = getDb();
    const row = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).get();
    if (!row || !(await verifyPassword(p.data.current, row.passwordHash))) return fail("Current password is incorrect");
    await db.update(schema.users).set({ passwordHash: await hashPassword(p.data.next) }).where(eq(schema.users.id, user.id));
    await audit(user, "team.password", "user", user.id);
    return { message: "Password updated" };
  });
}

/** Everyone can edit their own profile. The picture key must be one this person uploaded. */
export async function saveProfile(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const p = parse(z.object({
      name: z.string().trim().min(2, "Enter your name").max(80),
      phone: z.string().trim().max(30).regex(/^[+\d\s().-]*$/, "Phone number may only contain digits, spaces and + - ( )"),
      jobTitle: z.string().trim().max(60),
      bio: z.string().trim().max(400),
      avatar: z.string().max(200),
    }), { name: form.get("name"), phone: form.get("phone") ?? "", jobTitle: form.get("jobTitle") ?? "", bio: form.get("bio") ?? "", avatar: form.get("avatar") ?? "" });
    if (!p.ok) return p.state;
    const db = getDb();
    const cur = await db.select({ avatar: schema.users.avatar }).from(schema.users).where(eq(schema.users.id, user.id)).get();
    let avatar = p.data.avatar || null;
    if (avatar && avatar !== cur?.avatar && !avatar.startsWith(`uploads/avatars/${user.id}-`)) return fail("That picture is not valid. Upload it again.");
    if (avatar && avatar.includes("..")) avatar = cur?.avatar ?? null;
    await db.update(schema.users).set({ name: p.data.name, phone: p.data.phone || null, jobTitle: p.data.jobTitle || null, bio: p.data.bio || null, avatar }).where(eq(schema.users.id, user.id));
    if (cur?.avatar && cur.avatar !== avatar && cur.avatar.startsWith("uploads/avatars/")) await getEnv().FILES.delete(cur.avatar).catch(() => {});
    await audit(user, "team.profile", "user", user.id);
    revalidatePath("/admin", "layout");
    return { message: "Profile saved" };
  });
}
