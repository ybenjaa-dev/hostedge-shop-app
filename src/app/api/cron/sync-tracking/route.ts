import { NextResponse } from "next/server";
import { ensureSchema } from "@/db/ensure-schema";
import { getSessionUser } from "@/lib/auth";
import { purgeRateLimits } from "@/lib/ratelimit";
import { retryFailedEvents } from "@/features/tracking/capi";
import { syncTracking } from "@/features/shipping/service";

export const dynamic = "force-dynamic";

/** Cron: worker.ts calls https://internal/api/cron/sync-tracking with x-cron:1. Admins may trigger it manually. */
export async function POST(req: Request) {
  const fromCron = req.headers.get("x-cron") === "1" && new URL(req.url).hostname === "internal";
  if (!fromCron && !(await getSessionUser())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await ensureSchema();
  const [summary] = await Promise.all([syncTracking(), purgeRateLimits().catch(() => {}), retryFailedEvents().catch(() => 0)]);
  return NextResponse.json({ ok: true, ...summary, log: summary.log.slice(0, 50) });
}
