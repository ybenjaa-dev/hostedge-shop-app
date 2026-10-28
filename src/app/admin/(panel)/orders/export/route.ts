import { userCan } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { buildWhere } from "@/features/orders/queries";
import { toMajorString } from "@/lib/money";
import { tr } from "@/lib/i18n-core";

// Neutralise spreadsheet formula injection (=,+,-,@) and quote fields containing separators.
const esc = (v: unknown) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// order_items.name stores an i18n JSON snapshot; flatten "2x {json}" segments to plain text.
const plainItems = (s: string) => (s ?? "").replace(/\{[^{}]*\}/g, (m) => tr(m, "en", "fr"));

export async function GET(req: Request) {
  if (!(await userCan("orders.export"))) return new Response("Unauthorized", { status: 401 });
  const u = new URL(req.url);
  const ids = u.searchParams.get("ids")?.split(",").filter(Boolean);
  const db = getEnv().DB;
  let where: string;
  let args: unknown[];
  if (ids?.length) {
    where = `WHERE o.id IN (${ids.map(() => "?").join(",")})`;
    args = ids;
  } else {
    ({ where, args } = buildWhere(Object.fromEntries(u.searchParams) as Record<string, string>));
  }
  const rows = (
    await db
      .prepare(`SELECT o.*, (SELECT GROUP_CONCAT(i.qty || 'x ' || i.name || COALESCE(' (' || i.variant_name || ')', ''), ' | ') FROM order_items i WHERE i.order_id = o.id) AS items FROM orders o ${where} ORDER BY o.created_at DESC LIMIT 5000`)
      .bind(...args)
      .all<Record<string, string | number | null>>()
  ).results;
  const head = ["Order", "Date", "Status", "Name", "Phone", "Country", "City", "Address", "Items", "Subtotal", "Shipping", "Discount", "COD fee", "Total", "Currency", "Carrier", "Tracking", "Notes"];
  const lines = [head.join(",")];
  for (const o of rows) {
    const cur = o.currency as string;
    lines.push(
      [o.number, new Date(o.created_at as number).toISOString(), o.status, o.name, `+${o.phone}`, o.country, o.city, o.address, plainItems(o.items as string), toMajorString(o.subtotal as number, cur), toMajorString(o.shipping as number, cur), toMajorString(o.discount as number, cur), toMajorString(o.cod_fee as number, cur), toMajorString(o.total as number, cur), cur, o.carrier_id, o.tracking_number, o.notes].map(esc).join(","),
    );
  }
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
