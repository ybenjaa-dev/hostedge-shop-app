import Link from "next/link";
import { listOrders, statusCounts } from "@/features/orders/queries";
import { getSettings } from "@/lib/settings";
import { ORDER_STATUSES } from "@/lib/order-status";
import { statusInfo } from "@/lib/status-labels";
import { getEnv } from "@/lib/env";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { PageHeader, Empty, Pager } from "@/features/admin/components/ui";
import { bulkSendAction } from "@/features/orders/carrier-bridge";

export const metadata = { title: "Orders" };
type SP = Record<string, string | undefined>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const db = getEnv().DB;
  const [{ rows, total, perPage }, counts, cities, carriers] = await Promise.all([
    listOrders({ status: sp.status, city: sp.city, carrier: sp.carrier, from: sp.from, to: sp.to, q: sp.q, page }),
    statusCounts(),
    db.prepare("SELECT id, name FROM cities WHERE active = 1 ORDER BY name").all<{ id: string; name: string }>(),
    db.prepare("SELECT id FROM carriers WHERE enabled = 1").all<{ id: string }>(),
  ]);
  const labels = Object.fromEntries(ORDER_STATUSES.map((x) => [x, statusInfo(s, x, "en").label]));
  const colors = Object.fromEntries(ORDER_STATUSES.map((x) => [x, statusInfo(s, x, "en").color]));
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();
  const tab = (key: string, label: string, n?: number) => (
    <Link key={key} href={key ? `?status=${key}` : "?"} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${(sp.status ?? "") === key ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-ink/80 hover:bg-sunken"}`}>{label}{n != null && <span className="num ms-1.5 opacity-70">{n}</span>}</Link>
  );
  return (
    <>
      <PageHeader title="Orders" sub={`${total} order${total === 1 ? "" : "s"}`} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tab("", "All", Object.values(counts).reduce((a, b) => a + b, 0))}
        {ORDER_STATUSES.filter((x) => counts[x]).map((x) => tab(x, labels[x]!, counts[x]))}
      </div>
      <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={sp.q} placeholder="Search phone, name, order #, tracking…" aria-label="Search" className="field lg:col-span-2" />
        <select name="city" defaultValue={sp.city ?? ""} aria-label="City" className="field"><option value="">All cities</option>{cities.results.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="carrier" defaultValue={sp.carrier ?? ""} aria-label="Carrier" className="field"><option value="">All carriers</option><option value="none">No carrier</option>{carriers.results.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}</select>
        <input type="date" name="from" defaultValue={sp.from} aria-label="From date" className="field" />
        <div className="flex gap-2"><input type="date" name="to" defaultValue={sp.to} aria-label="To date" className="field" /><button className="btn btn-primary">Filter</button></div>
      </form>
      {rows.length === 0 ? (
        <Empty title="No orders found" hint="Orders placed on the storefront show up here instantly." action={<Link href="/admin/orders" className="btn btn-outline btn-sm">Clear filters</Link>} />
      ) : (
        <OrdersTable rows={rows} labels={labels} colors={colors} carriers={carriers.results.map((c) => ({ id: c.id, name: c.id }))} exportQs={qs} bulkCarrier={bulkSendAction} />
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil(total / perPage))} base="/admin/orders" params={sp} />
    </>
  );
}
