import { userCan } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { exportAbandoned } from "@/features/abandoned/queries";
import { buildExportCsv } from "@/features/abandoned/lib";

export async function GET(req: Request) {
  if (!(await userCan("abandoned.view"))) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams) as Record<string, string>;
  const [rows, s] = await Promise.all([exportAbandoned({ status: sp.status, q: sp.q, city: sp.city, from: sp.from, to: sp.to }), getSettings()]);
  return new Response(buildExportCsv(rows, s.store.currency), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="abandoned-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
