import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { hashPassword, randomToken, sha256Hex, verifyPassword } from "@/lib/crypto";
import { newId } from "@/lib/id";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { can, homeFor, isPerm, type Perm, type Role } from "@/lib/permissions";

const COOKIE = "he_session";
const SESSION_DAYS = 14;

export type SessionUser = { id: string; email: string; name: string; role: Role };

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  await ensureSchema();
  const id = await sha256Hex(token);
  const db = getDb();
  const row = await db
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, active: schema.users.active })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, Date.now())))
    .get();
  if (!row || !row.active) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

/** For route handlers: the signed-in user if their role has this permission, else null. */
export async function userCan(perm: Perm): Promise<SessionUser | null> {
  const u = await getSessionUser();
  return u && can(u.role, perm) ? u : null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  return u;
}

/** Page guard: signed in AND allowed to see this area; otherwise bounce to the first page the role may open. */
export async function requirePerm(perm: Perm): Promise<SessionUser> {
  const u = await requireUser();
  if (!can(u.role, perm)) redirect(`${homeFor(u.role)}?denied=1`);
  return u;
}

export async function requireOwner(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "owner") redirect("/admin?denied=1");
  return u;
}

/** For server actions: throws instead of redirecting so callers can return a typed error. */
export async function assertUser(need: "owner" | "staff" | Perm = "staff"): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new AuthError("Not signed in");
  if (need === "owner" && u.role !== "owner") throw new AuthError("Owner permission required");
  if (isPerm(need) && !can(u.role, need)) throw new AuthError("Your role isn’t allowed to do this.");
  return u;
}
export class AuthError extends Error {}

export async function createSession(userId: string) {
  const token = randomToken(32);
  const id = await sha256Hex(token);
  const expiresAt = Date.now() + SESSION_DAYS * 86400_000;
  await getDb().insert(schema.sessions).values({ id, userId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await getDb().delete(schema.sessions).where(eq(schema.sessions.id, await sha256Hex(token)));
  jar.delete(COOKIE);
}

let dummyHash: Promise<string> | null = null;

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await ensureSchema();
  const ip = await clientIp();
  const e = email.trim().toLowerCase();
  const [byIp, byEmail] = await Promise.all([rateLimit(`login:ip:${ip}`, 20, 900), rateLimit(`login:em:${e}`, 6, 900)]);
  if (!byIp.ok || !byEmail.ok) return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  const user = await getDb().select().from(schema.users).where(eq(schema.users.email, e)).get();
  dummyHash ??= hashPassword("dummy-password");
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid || !user.active) return { ok: false, error: "Invalid email or password." };
  await createSession(user.id);
  return { ok: true };
}

export async function createUser(input: { email: string; name: string; password: string; role: Role }) {
  const id = newId();
  await getDb().insert(schema.users).values({
    id,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
  });
  return id;
}

export async function hasAnyUser(): Promise<boolean> {
  await ensureSchema();
  const r = await getDb().select({ id: schema.users.id }).from(schema.users).limit(1).get();
  return !!r;
}

export async function logActivity(user: Pick<SessionUser, "id" | "name"> | null, action: string, entity?: string, entityId?: string, meta?: unknown) {
  try {
    await getDb().insert(schema.activityLog).values({
      id: newId(),
      userId: user?.id ?? null,
      userName: user?.name ?? "system",
      action,
      entity,
      entityId,
      meta: meta ? JSON.stringify(meta).slice(0, 2000) : null,
    });
  } catch {}
}
