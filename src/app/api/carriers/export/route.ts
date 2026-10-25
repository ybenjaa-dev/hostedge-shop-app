import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { ensureSchema } from "@/db/ensure-schema";
import { exportCarrierCsv } from "@/features/shipping/service";
import { getAdapter } from "@/features/shipping/registry";

export const dynamic = "force-dynamic";

/** POST {carrierId, orderIds[]} -> CSV download in the carrier's bulk-import format. Staff or owner. */
export async function POST(req: Request) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { carrierId?: unknown; orderIds?: unknown } | null;
  const carrierId = typeof body?.carrierId === "string" ? body.carrierId : "";
  const orderIds = Array.isArray(body?.orderIds) ? body!.orderIds.filter((x): x is string => typeof x === "string").slice(0, 500) : [];
  if (!getAdapter(carrierId) || !orderIds.length) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  await ensureSchema();
  const { filename, csv } = await exportCarrierCsv(carrierId, orderIds);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" } });
}
