import { userCan } from "@/lib/auth";
import { saveImage } from "@/lib/storage";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const user = (await userCan("products.edit")) ?? (await userCan("media.manage")) ?? (await userCan("appearance.edit"));
  if (!user) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  // CSRF: same-origin only (browsers always send Origin on POST).
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return Response.json({ ok: false, error: "Bad origin" }, { status: 403 });
  const rl = await rateLimit(`upload:${user.id}`, 120, 60);
  if (!rl.ok) return Response.json({ ok: false, error: "Too many uploads" }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ ok: false, error: "No file" }, { status: 400 });
  const res = await saveImage(file);
  return Response.json(res, { status: res.ok ? 200 : 400 });
}
