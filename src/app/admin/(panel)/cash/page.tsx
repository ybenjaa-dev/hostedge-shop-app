import { requirePerm } from "@/lib/auth";
import { DateRangeField } from "@/features/admin/components/date-picker";
import { DataTable } from "@/features/settings/components/table";
import Link from "next/link";
import { cashSummary } from "@/features/orders/queries";
import { getSettings } from "@/lib/settings";
import { getEnv } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { PageHeader, Panel, Stat, Empty, FilterBar, FbItem } from "@/features/admin/components/ui";
import { RemitButton } from "@/features/orders/components/remit-button";

export const metadata = { title: "COD cash" };

export default async function CashPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requirePerm("cash.manage");
  const sp = await searchParams;
  const s = await getSettings();
  const c = await cashSummary(sp);
  const f = (n: number) => formatMoney(n ?? 0, s.store.currency, "en");
  const pending = (await getEnv().DB.prepare(
    `SELECT id, number, name, carrier_id AS carrier, total, carrier_fee AS fee, updated_at AS at FROM orders WHERE status = 'delivered' AND remitted = 0 ORDER BY updated_at DESC LIMIT 100`,
  ).all<{ id: string; number: string; name: string; carrier: string | null; total: number; fee: number; at: number }>()).results;
  const byCarrier = (await getEnv().DB.prepare(
    `SELECT COALESCE(carrier_id,'—') AS carrier, SUM(CASE WHEN status='delivered' AND remitted=0 THEN total ELSE 0 END) AS pending, SUM(CASE WHEN status IN ('shipped','out_for_delivery','delivery_failed') THEN total ELSE 0 END) AS transit, SUM(CASE WHEN status='delivered' THEN carrier_fee ELSE 0 END) AS fees FROM orders GROUP BY carrier_id HAVING pending > 0 OR transit > 0`,
  ).all<{ carrier: string; pending: number; transit: number; fees: number }>()).results;
  return (
    <>
      <PageHeader title="COD cash tracking" sub="Expected vs collected vs pending remittance from carriers" />
      <FilterBar actions={<button className="btn btn-primary">Apply</button>}><FbItem wide><DateRangeField from={sp.from} to={sp.to} label="Date range" /></FbItem></FilterBar>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Expected cash" value={<bdi dir="ltr">{f(c.expected!)}</bdi>} sub="confirmed → delivered" />
        <Stat label="Collected" value={<bdi dir="ltr">{f(c.collected!)}</bdi>} tone="ok" sub={`${c.deliveredCount} delivered`} />
        <Stat label="In transit" value={<bdi dir="ltr">{f(c.inTransit!)}</bdi>} />
        <Stat label="Pending remittance" value={<bdi dir="ltr">{f(c.pendingRemit!)}</bdi>} tone="danger" sub="delivered, carrier still holds the cash" />
        <Stat label="Remitted" value={<bdi dir="ltr">{f(c.remitted!)}</bdi>} tone="ok" />
        <Stat label="Carrier fees" value={<bdi dir="ltr">{f(c.carrierFees!)}</bdi>} />
        <Stat label="Net (collected − fees)" value={<bdi dir="ltr">{f(c.collected! - c.carrierFees!)}</bdi>} tone="ok" />
        <Stat label="Returned value" value={<bdi dir="ltr">{f(c.returnedValue!)}</bdi>} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <Panel title="Awaiting remittance" actions={<RemitButton ids={pending.map((p) => p.id)} remitted label="Mark all as remitted" />}>
          {pending.length === 0 ? <Empty title="Nothing pending" hint="Delivered orders appear here until you mark the carrier payout as received." /> : (
            <DataTable minWidth="26rem" head={["Order", "Carrier", { label: "Cash", end: true }, { label: "Fee", end: true }]}>
              {pending.map((p) => <tr key={p.id}><td><Link className="num font-bold text-brand hover:underline" href={`/admin/orders/${p.id}`}>#{p.number}</Link> <span className="text-muted">{p.name}</span></td><td className="capitalize">{p.carrier ?? "—"}</td><td dir="ltr" className="num is-end font-bold">{f(p.total)}</td><td dir="ltr" className="num is-end text-muted">{f(p.fee)}</td></tr>)}
            </DataTable>
          )}
        </Panel>
        <Panel title="By carrier">
          {byCarrier.length === 0 ? <p className="text-sm text-muted">No cash with carriers.</p> : <ul className="space-y-3">{byCarrier.map((b) => <li key={b.carrier} className="text-sm"><p className="font-bold capitalize">{b.carrier}</p><p className="num text-muted">Pending <bdi dir="ltr">{f(b.pending)}</bdi> · Transit <bdi dir="ltr">{f(b.transit)}</bdi></p></li>)}</ul>}
        </Panel>
      </div>
    </>
  );
}
