import { NextResponse } from "next/server";
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
  if (!adapter?.webhookHandler) return NextResponse.json({ error: "not_supported" }, { status: 404 });
  await ensureSchema();
  const rl = await rateLimit(`webhook:${id}:${ipFromRequest(req)}`, 120, 60);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
  const en = await getEnv().DB.prepare("SELECT enabled FROM carriers WHERE id = ?").bind(id).first<{ enabled: number }>();
  if (!en?.enabled) return NextResponse.json({ error: "disabled" }, { status: 404 });
  try {
    const updates = await adapter.webhookHandler(req, await loadCredentials(id));
    let applied = 0;
    for (const u of updates) if ((await applyTrackingUpdate(id, u)) === "updated") applied++; // idempotent: repeats are no-ops
    return NextResponse.json({ ok: true, received: updates.length, applied });
  } catch (e) {
    if (e instanceof WebhookAuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    console.error("carrier webhook failed", id, e);
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
