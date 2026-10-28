import Link from "next/link";
import { Download } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { can, ROLE_INFO, type Role } from "@/lib/permissions";
import { statusInfo } from "@/lib/status-labels";
import { DateRangeField } from "@/features/admin/components/date-picker";
import { Empty, FbItem, FilterBar, PageHeader, Panel } from "@/features/admin/components/ui";
import { teamPerformance } from "@/features/orders/performance";
import { getKpiData } from "@/features/performance/queries";
import { buildMetrics, deltaOf, display } from "@/features/performance/summary";
import { bucketMode, bucketize, isoDay, previousPeriod, resolveRange, safeRate } from "@/features/performance/math";
import { KpiCard } from "./_components/kpi-card";
import { Funnel, Heatmap, OrdersTrend, OutcomeBar, RateTrend } from "./_components/charts";
import { BreakdownTable } from "./_components/breakdown";
import { TeamTable, type Row } from "./_components/team-table";

export const metadata = { title: "Team performance" };
type SP = Record<string, string | string[] | undefined>;
const last = (v: string | string[] | undefined) => (Array.isArray(v) ? v[v.length - 1] : v) ?? "";
const PRESETS = [["today", "Today"], ["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["month", "This month"]] as const;
const when = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export default async function PerformancePage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requirePerm("performance.view");
  const sp = await searchParams;
  const range = resolveRange({ range: last(sp.range), from: last(sp.from), to: last(sp.to) });
  const compare = last(sp.compare) !== "0";
  const money = can(user.role as Role, "dashboard.view") || can(user.role as Role, "cash.manage");
  const s = await getSettings();
  const cur = s.store.currency;
  const [d, team] = await Promise.all([getKpiData(range.from, range.to), teamPerformance(range.from, range.to)]);
  const prevP = previousPeriod(range.from, range.to);
  const metrics = buildMetrics(d).filter((m) => money || !m.money);
  const mode = bucketMode(range.days);
  const buckets = bucketize(d.days, range.from, range.to, mode);
  const c = d.cur;
  const qs = (extra: Record<string, string>) => new URLSearchParams({ ...(range.key === "custom" ? { from: isoDay(range.from), to: isoDay(range.to - 1) } : { range: range.key }), ...(compare ? {} : { compare: "0" }), ...extra }).toString();
  const rows: Row[] = team.agents.map((a) => ({
    ...a, roleLabel: ROLE_INFO[a.role as Role]?.label ?? a.role, roleColor: ROLE_INFO[a.role as Role]?.color ?? "#64748b",
    recent: a.recent.map((x) => ({ orderId: x.orderId, number: x.number, from: x.from, to: x.to, label: x.from && x.from !== x.to ? `${statusInfo(s, x.from, "en").label} → ${statusInfo(s, x.to, "en").label}` : statusInfo(s, x.to, "en").label, at: when.format(x.at) })),
  }));
  const bestProducts = [...d.products].sort((a, b) => b.revenue - a.revenue || b.orders - a.orders).slice(0, 10);
  const worstProducts = d.products.filter((p) => p.shipped >= 5 && p.failed > 0).sort((a, b) => safeRate(b.failed, b.shipped)! - safeRate(a.failed, a.shipped)! || b.shipped - a.shipped).slice(0, 10);
  const exportBtn = (kind: "kpi" | "team", label: string) => <a key={kind} href={`/admin/performance/export?${qs({ kind })}`} className="btn btn-outline btn-sm" download><Download className="size-4" aria-hidden />{label}</a>;
  const noOrders = c.orders === 0;
  return (
    <div className="space-y-5">
      <PageHeader title="Team performance" sub={`${isoDay(range.from)} → ${isoDay(range.to - 1)} · ${range.days} day${range.days > 1 ? "s" : ""}${compare ? ` · compared with ${isoDay(prevP.from)} → ${isoDay(prevP.to - 1)}` : ""} (UTC days)`}
        actions={<>{exportBtn("kpi", "Export KPIs (CSV)")}{exportBtn("team", "Export team (CSV)")}</>} />
      <nav aria-label="Date presets" className="flex flex-wrap gap-2">
        {PRESETS.map(([k, l]) => <Link key={k} href={`?${new URLSearchParams({ range: k, ...(compare ? {} : { compare: "0" }) })}`} aria-current={range.key === k ? "true" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${range.key === k ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:bg-sunken"}`}>{l}</Link>)}
        <span aria-current={range.key === "custom" ? "true" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${range.key === "custom" ? "border-brand bg-brand text-brand-ink" : "border-dashed border-line text-muted"}`}>Custom</span>
      </nav>
      <FilterBar actions={<button className="btn btn-primary">Apply</button>}>
        <FbItem wide><DateRangeField from={isoDay(range.from)} to={isoDay(range.to - 1)} label="Custom date range" /></FbItem>
        <div className="fb-item">
          <input type="hidden" name="compare" value="0" />
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" name="compare" value="1" defaultChecked={compare} className="size-4 accent-[var(--brand)]" />Compare with previous period</label>
        </div>
      </FilterBar>

      {noOrders && <Empty title="No orders in this range" hint="Pick a wider range. Numbers appear here as soon as orders are placed." />}

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {metrics.map((m) => <KpiCard key={m.key} label={m.label} hint={m.hint} value={<bdi dir="ltr">{display(m, m.cur, cur)}</bdi>} sub={m.sub} delta={compare ? deltaOf(m) : null}
          tone={m.key === "returns" && (m.cur ?? 0) > 0.2 ? "danger" : m.key === "deliveredRevenue" ? "ok" : undefined} />)}
      </section>

      {!noOrders && (<>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <Panel title="Conversion funnel">
            <Funnel steps={[{ label: "New orders", value: c.orders }, { label: "Confirmed", value: c.confirmed }, { label: "Shipped", value: c.shipped }, { label: "Delivered", value: c.delivered }]} />
          </Panel>
          <Panel title="Where the orders ended up">
            <OutcomeBar parts={[{ label: "Delivered", value: c.delivered, color: "var(--ok)" }, { label: "Returned / failed", value: c.failed, color: "var(--danger)" }, { label: "Cancelled", value: c.cancelled, color: "#94a3b8" }, { label: "Still open", value: Math.max(0, c.orders - c.delivered - c.failed - c.cancelled), color: "var(--accent)" }]} />
            <p className="mt-4 text-xs text-muted">Recent orders are often still open, so delivery and return rates keep settling for a few days after the range ends.</p>
          </Panel>
          <Panel title={`Orders per ${mode}`}><OrdersTrend data={buckets} weekly={mode === "week"} /></Panel>
          <Panel title={`Confirmation rate per ${mode}`}><RateTrend data={buckets} weekly={mode === "week"} /></Panel>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          <Panel title="By city (top 10)"><BreakdownTable caption="Orders by city" rows={d.cities} nameHead="City" currency={cur} showMoney={money} /></Panel>
          <Panel title="By carrier"><BreakdownTable caption="Orders by carrier" rows={d.carriers} nameHead="Carrier" currency={cur} showMoney={money} /></Panel>
          <Panel title="Top products by delivered revenue"><BreakdownTable caption="Best products" rows={bestProducts} nameHead="Product" currency={cur} showMoney={money} /></Panel>
          <Panel title="Highest return rate (products)">{worstProducts.length ? <BreakdownTable caption="Products with the most returns" rows={worstProducts} nameHead="Product" currency={cur} showMoney={false} /> : <p className="text-sm text-muted">No product has 5+ shipped orders with returns in this range.</p>}</Panel>
          <Panel title="By traffic source"><BreakdownTable caption="Orders by ad channel" rows={d.channels} nameHead="Source" currency={cur} showMoney={money} /><p className="mt-3 text-xs text-muted">Meta and TikTok are detected from the ad click ids captured at checkout.</p></Panel>
          <Panel title="When orders come in"><Heatmap grid={d.heat} /></Panel>
        </div>
      </>)}

      <section aria-labelledby="team-h" className="space-y-3">
        <h2 id="team-h" className="display text-lg font-extrabold">Teammates</h2>
        {rows.length === 0 ? <Empty title="No team activity in this range" hint="Status changes made by teammates show up here." /> : <TeamTable rows={rows} currency={cur} showMoney={money} />}
        <p className="text-xs text-muted">Counts are the orders each teammate acted on in the range. Confirm rate = confirmed ÷ handled. First reply = placed → their first action, for orders where they acted first. Confirmation quality = share of the orders they confirmed that ended delivered (needs delivered or failed outcomes). A flag marks a figure far from the team average, as a prompt to look, not a verdict.</p>
      </section>
    </div>
  );
}
