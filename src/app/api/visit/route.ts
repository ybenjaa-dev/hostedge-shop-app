import { cookies, headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { findBlock, learnBlocked, recordVisit, type VisitBody } from "@/features/visitors/server";
import { FP_RE, VID_RE } from "@/features/visitors/signals";

const COOKIE = "he_vid";
const stamp = (jar: Awaited<ReturnType<typeof cookies>>, id: string) =>
  jar.set(COOKIE, id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });

/** Visitor beacon. A blocked visitor gets `{blocked:true}`; the app then sends them to Google. */
export async function POST(req: Request) {
  const s = await getSettings();
  if (!s.engage.visitors) return new Response(null, { status: 204 });
  if (!(await rateLimit(`visit:${await clientIp()}`, 120, 60)).ok) return new Response(null, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as VisitBody;
  const jar = await cookies();
  const cookieVid = jar.get(COOKIE)?.value ?? null;
  const fp = typeof body.fp === "string" && FP_RE.test(body.fp) ? body.fp : null;

  const h = await headers();
  const hit = await findBlock(h, { fp });
  if (hit) {
    // a strong match from a NEW cookie / network teaches the block those too; a shared IP alone never does
    await learnBlocked(h, hit, fp, cookieVid && VID_RE.test(cookieVid) ? cookieVid : null).catch((e) => console.error("learnBlocked", e));
    if (hit.visitorId) stamp(jar, hit.visitorId);
    return Response.json({ blocked: true }, { headers: { "Cache-Control": "no-store" } });
  }

  const r = await recordVisit(req, body, cookieVid);
  if (!r) return new Response(null, { status: 204 });
  stamp(jar, r.id);
  const late = await findBlock(h, { fp, vid: r.id });
  return Response.json({ ok: true, isNew: r.isNew, blocked: !!late }, { headers: { "Cache-Control": "no-store" } });
}
