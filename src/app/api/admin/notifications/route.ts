import { getSessionUser } from "@/lib/auth";
import { getEnv } from "@/lib/env";

/** Polled by the admin header: orders created after `since` (ms) and how many still wait for confirmation. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const since = Number(new URL(req.url).searchParams.get("since"));
  const db = getEnv().DB;
  const [fresh, pend] = await db.batch([
    db.prepare("SELECT id, number, name, city, total, currency, created_at AS createdAt FROM orders WHERE created_at > ? ORDER BY created_at DESC LIMIT 10").bind(Number.isFinite(since) && since > 0 ? since : Date.now()),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status IN ('new','pending_confirmation')"),
  ]);
  return Response.json({ ok: true, now: Date.now(), orders: fresh!.results, pending: (pend!.results[0] as { n: number }).n }, { headers: { "Cache-Control": "no-store" } });
}
