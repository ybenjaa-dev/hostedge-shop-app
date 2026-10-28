import { getSessionUser } from "@/lib/auth";
import { loadFeed } from "@/features/admin/notification-queries";

/** Polled by the admin bell: recent notifications limited to the sections the signed-in role may view. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  const { items, pending } = await loadFeed(user.role);
  return Response.json({ ok: true, now: Date.now(), items, pending }, { headers: { "Cache-Control": "no-store" } });
}
