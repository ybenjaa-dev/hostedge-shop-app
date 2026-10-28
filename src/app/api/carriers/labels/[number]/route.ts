import { userCan } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Shipping label PDF. Admin-only; never cached or public. */
export async function GET(_req: Request, ctx: { params: Promise<{ number: string }> }) {
  if (!(await userCan("orders.fulfil"))) return new Response("Forbidden", { status: 403 });
  const { number } = await ctx.params;
  if (!/^[\w-]{1,40}$/.test(number)) return new Response("Not found", { status: 404 });
  const obj = await getEnv().FILES.get(`labels/${number}.pdf`);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="label-${number}.pdf"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
}
