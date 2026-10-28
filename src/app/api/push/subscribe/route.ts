import { cookies } from "next/headers";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { newId } from "@/lib/id";
import { isLang } from "@/lib/i18n-core";
import { geoOf } from "@/features/visitors/server";

const body = z.object({
  endpoint: z.string().url().max(600).refine((u) => u.startsWith("https://"), "https only"),
  keys: z.object({ p256dh: z.string().min(80).max(120), auth: z.string().min(16).max(40) }),
  lang: z.string().max(5).optional(),
});

/** A browser opted in to notifications. */
export async function POST(req: Request) {
  const s = await getSettings();
  if (!s.engage.push) return Response.json({ ok: false }, { status: 404 });
  if (!(await rateLimit(`pushsub:${await clientIp()}`, 20, 600)).ok) return Response.json({ ok: false }, { status: 429 });
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ ok: false }, { status: 400 });
  await ensureSchema();
  const g = geoOf(req);
  const vid = (await cookies()).get("he_vid")?.value ?? null;
  const db = getEnv().DB;
  await db.prepare(`INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, visitor_id, lang, country, city, ua, created_at, active, failures) VALUES (?,?,?,?,?,?,?,?,?,?,1,0)
    ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, visitor_id = COALESCE(excluded.visitor_id, visitor_id), lang = excluded.lang, country = COALESCE(excluded.country, country), city = COALESCE(excluded.city, city), active = 1, failures = 0`)
    .bind(newId(), p.data.endpoint, p.data.keys.p256dh, p.data.keys.auth, vid, isLang(p.data.lang) ? p.data.lang : null, g.country, g.city, (req.headers.get("user-agent") ?? "").slice(0, 200), Date.now()).run();
  if (vid) await db.prepare("UPDATE visitors SET push = 1 WHERE id = ?").bind(vid).run();
  return Response.json({ ok: true });
}

/** Opt out. */
export async function DELETE(req: Request) {
  const p = z.object({ endpoint: z.string().max(600) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ ok: false }, { status: 400 });
  await ensureSchema();
  await getEnv().DB.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(p.data.endpoint).run();
  return Response.json({ ok: true });
}
