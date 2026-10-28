import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { ensureSchema } from "@/db/ensure-schema";
import { ipFromRequest, rateLimit } from "@/lib/ratelimit";
import { getAdapter } from "@/features/shipping/registry";
import { loadCredentials } from "@/features/shipping/credentials";
import { applyTrackingUpdate } from "@/features/shipping/service";
import { WebhookAuthError } from "@/features/shipping/types";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const adapter = getAdapter(id);
  if (!adapter?.webhookHandler) return apiError(404, "not_supported", "Webhooks are not supported for this carrier");
  await ensureSchema();
  const rl = await rateLimit(`webhook:${id}:${ipFromRequest(req)}`, 120, 60);
  if (!rl.ok) return apiError(429, "rate_limited", "Too many requests", { "retry-after": String(rl.retryAfter) });
  const en = await getEnv().DB.prepare("SELECT enabled FROM carriers WHERE id = ?").bind(id).first<{ enabled: number }>();
  if (!en?.enabled) return apiError(404, "disabled", "Carrier is disabled");
  try {
    const updates = await adapter.webhookHandler(req, await loadCredentials(id));
    let applied = 0;
    for (const u of updates) if ((await applyTrackingUpdate(id, u)) === "updated") applied++; // idempotent: repeats are no-ops
    return NextResponse.json({ ok: true, received: updates.length, applied });
  } catch (e) {
    if (e instanceof WebhookAuthError) return apiError(401, "unauthorized", "Invalid signature");
    console.error("carrier webhook failed", id, e);
    return apiError(400, "bad_request", "Could not process the payload");
  }
}
