import "server-only";
import type { Perm } from "@/lib/permissions";
import { allLangs } from "@/lib/i18n-core";
import { ensureLangs } from "@/lib/languages";
import { assertUser, AuthError, logActivity, type SessionUser } from "@/lib/auth";

export type ActionState = { ok?: boolean; error?: string; message?: string; fields?: Record<string, string>; id?: string; ts?: number } | undefined;

/** Wraps an admin server action: permission check (every call), error normalisation, never leaks internals. */
export async function run(role: "owner" | "staff" | Perm, fn: (user: SessionUser) => Promise<ActionState | void>): Promise<ActionState> {
  try {
    await ensureLangs();
    const user = await assertUser(role);
    const r = await fn(user);
    return { ok: true, ts: Date.now(), ...(r ?? {}) };
  } catch (e) {
    if (e instanceof AuthError) return { error: e.message, ts: Date.now() };
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("admin action failed", e);
    const msg = e instanceof Error && /UNIQUE/i.test(e.message) ? "That value is already in use." : "Something went wrong. Please try again.";
    return { error: msg, ts: Date.now() };
  }
}

export const audit = logActivity;

export function fd(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
export function fdI18n(form: FormData, key: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of allLangs()) {
    const v = fd(form, `${key}.${l}`);
    if (v) out[l] = v;
  }
  return out;
}
