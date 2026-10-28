import { apiError } from "@/lib/api-error";
import { userCan } from "@/lib/auth";
import { ensureSchema } from "@/db/ensure-schema";
import { exportCarrierCsv } from "@/features/shipping/service";
import { getAdapter } from "@/features/shipping/registry";

export const dynamic = "force-dynamic";

/** POST {carrierId, orderIds[]} -> CSV download in the carrier's bulk-import format. Staff or owner. */
export async function POST(req: Request) {
  if (!(await userCan("orders.fulfil"))) return apiError(403, "forbidden", "Not allowed");
  const body = (await req.json().catch(() => null)) as { carrierId?: unknown; orderIds?: unknown } | null;
  const carrierId = typeof body?.carrierId === "string" ? body.carrierId : "";
  const orderIds = Array.isArray(body?.orderIds) ? body!.orderIds.filter((x): x is string => typeof x === "string").slice(0, 500) : [];
  if (!getAdapter(carrierId) || !orderIds.length) return apiError(400, "bad_request", "Invalid carrier or orders");
  await ensureSchema();
  const { filename, csv } = await exportCarrierCsv(carrierId, orderIds);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" } });
}
