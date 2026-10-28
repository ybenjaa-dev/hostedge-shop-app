import { userCan } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { toCsv } from "@/lib/csv";
import { toMajorString } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { getKpiData } from "@/features/performance/queries";
import { buildMetrics, deltaOf } from "@/features/performance/summary";
import { isoDay, previousPeriod, resolveRange } from "@/features/performance/math";
import { teamPerformance } from "@/features/orders/performance";
import { ROLE_INFO, type Role } from "@/lib/permissions";

export async function GET(req: Request) {
  const user = await userCan("performance.view");
  if (!user) return new Response("Unauthorized", { status: 401 });
  const money = (can(user.role, "dashboard.view") || can(user.role, "cash.manage"));
  const q = new URL(req.url).searchParams;
  const r = resolveRange({ range: q.get("range") ?? undefined, from: q.get("from") ?? undefined, to: q.get("to") ?? undefined });
  const cur = (await getSettings()).store.currency;
  const span = `${isoDay(r.from)}_${isoDay(r.to - 1)}`;
  let rows: unknown[][];
  let name: string;
  if (q.get("kind") === "team") {
    const { agents } = await teamPerformance(r.from, r.to);
    name = "team-performance";
    rows = [
      ["Teammate", "Role", "Handled", "Confirmed", "Cancelled", "No answer", "Postponed", "Shipped", "Confirmation rate %", "Avg first reply (min)", "Handled per day", "Delivered of confirmed", "Failed of confirmed", "Confirmation quality %", ...(money ? [`Cash delivered (${cur})`] : [])],
      ...agents.map((a) => [a.name, ROLE_INFO[a.role as Role]?.label ?? a.role, a.handled, a.confirmed, a.cancelled, a.noAnswer, a.postponed, a.shipped, a.confirmRate == null ? "" : (a.confirmRate * 100).toFixed(1), a.avgResponseMin == null ? "" : a.avgResponseMin.toFixed(1), a.perDay.toFixed(2), a.delivered, a.failed, a.deliveredRate == null ? "" : (a.deliveredRate * 100).toFixed(1), ...(money ? [toMajorString(a.cashDelivered, cur)] : [])]),
    ];
  } else {
    const d = await getKpiData(r.from, r.to);
    const p = previousPeriod(r.from, r.to);
    name = "kpi-summary";
    const fmt = (m: ReturnType<typeof buildMetrics>[number], v: number | null) => (v == null ? "" : m.kind === "rate" ? (v * 100).toFixed(2) : m.kind === "duration" ? v.toFixed(1) : m.kind === "money" ? toMajorString(Math.round(v), cur) : v);
    const unit = (m: ReturnType<typeof buildMetrics>[number]) => (m.kind === "rate" ? "%" : m.kind === "duration" ? "min" : m.kind === "money" ? cur : "");
    rows = [
      ["Metric", "Unit", `Current (${isoDay(r.from)} to ${isoDay(r.to - 1)})`, `Previous (${isoDay(p.from)} to ${isoDay(p.to - 1)})`, "Change (% or percentage points)"],
      ...buildMetrics(d).filter((m) => money || !m.money).map((m) => { const dl = deltaOf(m); return [m.label, unit(m), fmt(m, m.cur), fmt(m, m.prev), dl.value == null ? "" : +(dl.value * 100).toFixed(2)]; }),
    ];
  }
  return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-${span}.csv"`, "Cache-Control": "no-store" } });
}
