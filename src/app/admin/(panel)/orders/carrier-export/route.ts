import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  if (!(await getSessionUser())) return new Response("Unauthorized", { status: 401 });
  const u = new URL(req.url);
  const carrier = u.searchParams.get("carrier") ?? "";
  const ids = (u.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 500);
  if (!carrier || !ids.length) return new Response("Missing carrier or ids", { status: 400 });
  const { exportCarrierCsv } = await import("@/features/shipping/service");
  const { filename, csv } = await exportCarrierCsv(carrier, ids);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.\-]/g, "_")}"`, "Cache-Control": "no-store" } });
}
