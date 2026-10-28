import { requirePerm } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { ROLE_INFO, type Role } from "@/lib/permissions";
import { DateRangeField } from "@/features/admin/components/date-picker";
import { Badge, Empty, FbItem, FilterBar, PageHeader, Stat } from "@/features/admin/components/ui";
import { DataTable } from "@/features/settings/components/table";
import { teamPerformance } from "@/features/orders/performance";
import { one } from "@/features/settings/lib";

export const metadata = { title: "Team performance" };
const dayMs = 864e5;
const pct = (n: number | null) => (n == null ? "—" : `${Math.round(n * 100)}%`);
const mins = (m: number | null) => (m == null ? "—" : m < 60 ? `${Math.round(m)} min` : m < 1440 ? `${(m / 60).toFixed(1)} h` : `${(m / 1440).toFixed(1)} d`);

export default async function PerformancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePerm("performance.view");
  const sp = await searchParams;
  const s = await getSettings();
  const qTo = one(sp.to) || "", qFrom = one(sp.from) || "";
  const to = qTo ? Date.parse(`${qTo}T23:59:59`) : Date.now();
  const from = qFrom ? Date.parse(`${qFrom}T00:00:00`) : to - 30 * dayMs;
  const { agents, orders, confirmedTotal } = await teamPerformance(from, to);
  const cur = s.store.currency;
  const best = [...agents].filter((a) => a.handled >= 5 && a.confirmRate != null).sort((a, b) => (b.confirmRate ?? 0) - (a.confirmRate ?? 0))[0];
  return (
    <div className="space-y-5">
      <PageHeader title="Team performance" sub="Who confirmed, cancelled and shipped what — and how those orders ended up. Built from the order history, so it is always in sync." />
      <FilterBar actions={<button className="btn btn-primary">Apply</button>}><FbItem wide><DateRangeField from={qFrom || new Date(from).toISOString().slice(0, 10)} to={qTo || new Date(to).toISOString().slice(0, 10)} label="Date range" /></FbItem></FilterBar>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders in range" value={orders} />
        <Stat label="Confirmed by the team" value={confirmedTotal} />
        <Stat label="Best confirmation rate" value={best ? pct(best.confirmRate) : "—"} sub={best ? best.name : "needs 5+ handled orders"} tone="ok" />
        <Stat label="Active teammates" value={agents.filter((a) => a.handled > 0).length} />
      </div>
      {agents.length === 0 ? <Empty title="No team activity in this range" hint="Status changes made by teammates show up here." /> : (
        <DataTable minWidth="50rem" head={["Teammate", { label: "Handled", end: true }, { label: "Confirmed", end: true }, { label: "Cancelled", end: true }, { label: "No answer", end: true }, { label: "Confirm rate", end: true }, { label: "First reply", end: true }, { label: "Delivered rate", end: true }, { label: "Cash delivered", end: true }]}>
          {agents.map((a) => (
            <tr key={a.userId} className={a.active ? "" : "opacity-60"}>
              <td><div className="font-semibold">{a.name}</div><Badge color={ROLE_INFO[a.role as Role]?.color ?? "#64748b"}>{ROLE_INFO[a.role as Role]?.label ?? a.role}</Badge></td>
              <td className="num is-end">{a.handled}</td>
              <td className="num is-end font-semibold text-ok">{a.confirmed}</td>
              <td className="num is-end text-danger">{a.cancelled}</td>
              <td className="is-end"><span className="num">{a.noAnswer}</span>{a.postponed > 0 && <span className="block text-[11px] text-muted">+{a.postponed} postponed</span>}</td>
              <td className="is-end"><span className="num font-bold">{pct(a.confirmRate)}</span><span className="ms-auto mt-1 block h-1.5 w-20 overflow-hidden rounded-full bg-sunken"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round((a.confirmRate ?? 0) * 100)}%` }} /></span></td>
              <td className="num is-end">{mins(a.avgResponseMin)}</td>
              <td className="is-end"><span className="num font-bold">{pct(a.deliveredRate)}</span><span className="block text-[11px] text-muted">{a.delivered} delivered · {a.failed} failed</span></td>
              <td dir="ltr" className="num is-end">{formatMoney(a.cashDelivered, cur, "en")}</td>
            </tr>
          ))}
        </DataTable>
      )}
      <p className="text-xs text-muted">Confirm rate = orders the teammate confirmed ÷ orders they touched. First response = time from the order being placed to their first action, for orders where they acted first. Delivered rate looks at what happened to the orders they confirmed.</p>
    </div>
  );
}
