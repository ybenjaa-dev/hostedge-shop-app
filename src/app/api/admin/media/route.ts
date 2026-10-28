import { getSessionUser, userCan } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { findDuplicate, listMedia, mediaUsage, saveMedia } from "@/features/media/server";

/** List (`?q=&before=`) or check a hash (`?hash=`) so the browser can skip uploading a picture that is already in the library. */
export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const u = new URL(req.url);
  const hash = u.searchParams.get("hash");
  if (hash) return Response.json({ ok: true, media: await findDuplicate(hash) });
  const usage = u.searchParams.get("usage");
  if (usage?.startsWith("uploads/")) return Response.json({ ok: true, usage: await mediaUsage(usage) });
  const before = parseInt(u.searchParams.get("before") ?? "", 10);
  return Response.json({ ok: true, ...(await listMedia({ q: u.searchParams.get("q") ?? "", before: Number.isFinite(before) ? before : undefined })) });
}

export async function POST(req: Request) {
  const user = (await userCan("media.manage")) ?? (await userCan("products.edit")) ?? (await userCan("appearance.edit")) ?? (await userCan("categories.manage"));
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return Response.json({ ok: false, error: "Bad origin" }, { status: 403 });
  const rl = await rateLimit(`upload:${user.id}`, 240, 60);
  if (!rl.ok) return Response.json({ ok: false, error: "Too many uploads" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  const res = await saveMedia(form, user.id);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
