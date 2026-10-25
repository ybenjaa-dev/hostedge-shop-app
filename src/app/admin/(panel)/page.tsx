import { DateRangeField } from "@/features/admin/components/date-picker";
import Link from "next/link";
import { getDashboard } from "@/features/admin/dashboard-queries";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { statusInfo } from "@/lib/status-labels";
import { PageHeader, Panel, Stat, Badge, FilterBar, FbItem } from "@/features/admin/components/ui";
import { BarChart } from "@/features/admin/components/bar-chart";
import { tr } from "@/lib/i18n-core";
import { getSetupChecklist } from "@/features/photos/queries";
import { SetupChecklist } from "@/features/photos/setup-checklist";

export const metadata = { title: "Dashboard" };
const DAY = 86400_000;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string; denied?: string }> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const now = Date.now();
  const endOfToday = Math.floor(now / DAY) * DAY + DAY;
  let from: number, to = endOfToday;
  const presets: Record<string, number> = { "7": 7, "30": 30, "90": 90, today: 1 };
  if (sp.from && Date.parse(sp.from)) {
    from = Date.parse(`${sp.from}T00:00:00Z`);
    if (sp.to && Date.parse(sp.to)) to = Date.parse(`${sp.to}T00:00:00Z`) + DAY;
  } else from = endOfToday - (presets[sp.range ?? "30"] ?? 30) * DAY;
  const [d, setup] = await Promise.all([getDashboard(from, to), getSetupChecklist()]);
  const cur = s.store.currency;
  const f = (n: number) => formatMoney(n, cur, "en");
  const active = sp.from ? "custom" : sp.range ?? "30";
  const chip = (k: string, l: string) => <Link key={k} href={`?range=${k}`} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${active === k ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:bg-sunken"}`}>{l}</Link>;
  return (
    <>
      <PageHeader title="Dashboard" sub={`${new Date(from).toISOString().slice(0, 10)} → ${new Date(to - DAY).toISOString().slice(0, 10)} (UTC days)`} actions={<>{chip("today", "Today")}{chip("7", "7 days")}{chip("30", "30 days")}{chip("90", "90 days")}</>} />
      <SetupChecklist {...setup} />
      {sp.denied && <p role="alert" className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">That section is for the store owner only.</p>}
      <FilterBar actions={<button className="btn btn-primary">Apply</button>}><FbItem wide><DateRangeField from={sp.from} to={sp.to} label="Date range" /></FbItem></FilterBar>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders today" value={d.today} sub={`${d.pendingConfirm} waiting for confirmation`} />
        <Stat label="Orders (range)" value={d.orders} />
        <Stat label="Revenue" value={<bdi dir="ltr">{f(d.revenue)}</bdi>} sub="excl. cancelled / refunded" />
        <Stat label="Cash collected" value={<bdi dir="ltr">{f(d.collected)}</bdi>} tone="ok" />
        <Stat label="Confirmation rate" value={`${d.confirmationRate}%`} />
        <Stat label="Delivery rate" value={`${d.deliveryRate}%`} tone="ok" sub="delivered / shipped" />
        <Stat label="Return rate" value={`${d.returnRate}%`} tone={d.returnRate > 15 ? "danger" : undefined} sub="returned / shipped" />
        <Stat label="Avg. order" value={<bdi dir="ltr">{d.orders ? f(Math.round(d.revenue / d.orders)) : "—"}</bdi>} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Orders per day"><BarChart label="Orders per day" data={d.series.map((x) => ({ label: x.day, value: x.orders }))} format={(n) => String(n)} /></Panel>
        <Panel title="Revenue per day"><BarChart label="Revenue per day" data={d.series.map((x) => ({ label: x.day, value: x.revenue }))} format={f} /></Panel>
        <Panel title="Top products">
          {d.topProducts.length === 0 ? <p className="text-sm text-muted">No sales in this range.</p> : <ul className="divide-y divide-line">{d.topProducts.map((p, i) => <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0 truncate font-semibold">{tr(p.name, "en")}</span><span className="num shrink-0 text-muted">{p.qty} sold · <bdi dir="ltr">{f(p.revenue)}</bdi></span></li>)}</ul>}
        </Panel>
        <Panel title="Top cities">
          {d.topCities.length === 0 ? <p className="text-sm text-muted">No orders in this range.</p> : <ul className="space-y-2.5">{d.topCities.map((c) => <li key={c.city} className="text-sm"><div className="mb-1 flex justify-between"><span className="font-semibold">{c.city}</span><span className="num text-muted">{c.orders}</span></div><div className="h-1.5 rounded-full bg-sunken"><div className="h-full rounded-full bg-brand" style={{ width: `${(c.orders / d.topCities[0]!.orders) * 100}%` }} /></div></li>)}</ul>}
        </Panel>
        <Panel title="Latest orders" className="lg:col-span-2" actions={<Link href="/admin/orders" className="text-sm font-bold text-brand hover:underline">View all</Link>}>
          {d.recent.length === 0 ? <p className="text-sm text-muted">No orders yet. Share your store link to get started.</p> : <ul className="divide-y divide-line">{d.recent.map((o) => { const i = statusInfo(s, o.status, "en"); return <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"><Link href={`/admin/orders/${o.id}`} className="num font-extrabold text-brand hover:underline">#{o.number}</Link><span className="min-w-0 flex-1 truncate px-2">{o.name}</span><Badge color={i.color}>{i.label}</Badge><bdi dir="ltr" className="num w-28 text-end font-bold">{f(o.total)}</bdi></li>; })}</ul>}
        </Panel>
      </div>
    </>
  );
}
