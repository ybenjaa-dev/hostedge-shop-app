import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { clientIp, rateLimit } from "@/lib/ratelimit";

/** The service worker reports a tap on a notification (for the campaign's click count). */
export async function POST(req: Request) {
  if (!(await rateLimit(`pushclick:${await clientIp()}`, 60, 60)).ok) return new Response(null, { status: 429 });
  const id = ((await req.json().catch(() => ({}))) as { id?: string }).id;
  if (typeof id !== "string" || !/^[a-z0-9]{8,40}$/.test(id)) return new Response(null, { status: 400 });
  await ensureSchema();
  await getEnv().DB.prepare("UPDATE push_messages SET clicks = clicks + 1 WHERE id = ?").bind(id).run();
  return new Response(null, { status: 204 });
}
