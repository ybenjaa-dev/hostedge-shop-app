import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { headers } from "next/headers";

/** Fixed-window counter in D1. Returns whether the call is allowed. */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  await ensureSchema();
  const now = Date.now();
  const reset = now + windowSec * 1000;
  const row = await getEnv()
    .DB.prepare(
      `INSERT INTO rate_limits (key, count, reset_at) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN reset_at <= ?3 THEN 1 ELSE count + 1 END,
         reset_at = CASE WHEN reset_at <= ?3 THEN ?2 ELSE reset_at END
       RETURNING count, reset_at`,
    )
    .bind(key, reset, now)
    .first<{ count: number; reset_at: number }>();
  const count = row?.count ?? 1;
  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter: Math.ceil(((row?.reset_at ?? reset) - now) / 1000) };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

export function ipFromRequest(req: Request): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

/** Housekeeping: drop expired counters (called opportunistically from cron). */
export async function purgeRateLimits() {
  await getEnv().DB.prepare("DELETE FROM rate_limits WHERE reset_at < ?").bind(Date.now()).run();
}
