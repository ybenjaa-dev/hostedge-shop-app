import { getEnv } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { randomToken } from "@/lib/crypto";

const MAX = 400_000;
const kind = (b: Uint8Array): string | null =>
  b[0] === 0xff && b[1] === 0xd8 ? "image/jpeg" : b[0] === 0x89 && b[1] === 0x50 ? "image/png" : b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45 ? "image/webp" : null;

/** Any signed-in team member uploads their own (already square-cropped) picture. The profile form saves the returned key. */
export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) return Response.json({ ok: false, error: "Not signed in" }, { status: 401 });
  if (!(await rateLimit(`avatar:${u.id}`, 20, 3600)).ok) return Response.json({ ok: false, error: "Too many uploads, try again later." }, { status: 429 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File) || !file.size) return Response.json({ ok: false, error: "Choose a picture." }, { status: 400 });
  if (file.size > MAX) return Response.json({ ok: false, error: "Picture is too large." }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = kind(bytes);
  if (!type) return Response.json({ ok: false, error: "Use a JPEG, PNG or WebP picture." }, { status: 415 });
  const key = `uploads/avatars/${u.id}-${randomToken(6)}.${type === "image/webp" ? "webp" : type === "image/png" ? "png" : "jpg"}`;
  await getEnv().FILES.put(key, bytes, { httpMetadata: { contentType: type } });
  return Response.json({ ok: true, key });
}
