import { cookies } from "next/headers";
import { getSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { recordVisit, type VisitBody } from "@/features/visitors/server";

const COOKIE = "he_vid";

/** Visitor beacon — only called after the visitor accepted the privacy notice. */
export async function POST(req: Request) {
  const s = await getSettings();
  if (!s.engage.visitors) return new Response(null, { status: 204 });
  if (!(await rateLimit(`visit:${await clientIp()}`, 120, 60)).ok) return new Response(null, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as VisitBody;
  const jar = await cookies();
  const r = await recordVisit(req, body, jar.get(COOKIE)?.value ?? null);
  if (!r) return new Response(null, { status: 204 });
  jar.set(COOKIE, r.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
  return Response.json({ ok: true, isNew: r.isNew });
}
