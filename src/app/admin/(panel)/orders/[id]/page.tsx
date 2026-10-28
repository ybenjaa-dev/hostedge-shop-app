import { requirePerm } from "@/lib/auth";
import { can, canSetStatus } from "@/lib/permissions";
import Link from "next/link";
import { OrderTimeline } from "@/features/orders/components/order-timeline";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone, Printer, FileText, AlertTriangle } from "lucide-react";
import { getOrderFull } from "@/features/orders/queries";
import { getSettings } from "@/lib/settings";
import { statusInfo } from "@/lib/status-labels";
import { ORDER_STATUSES, TRANSITIONS, type OrderStatus } from "@/lib/order-status";
import { tr } from "@/lib/i18n-core";
import { formatMoney, toMajorString } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { fileUrl } from "@/lib/storage";
import { Badge, Panel, PageHeader } from "@/features/admin/components/ui";
import { StatusPanel, NoteForm, EditOrderForm, CarrierPanel, BlockPhone } from "@/features/orders/components/order-panels";
import { listCarriers } from "@/features/shipping/service";
import { getEnv } from "@/lib/env";

export const metadata = { title: "Order" };

const fill = (tpl: string, v: Record<string, string>) => Object.entries(v).reduce((s, [k, x]) => s.replaceAll(`{${k}}`, x), tpl);

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePerm("orders.view");
  const mayStatus = (TRANSITIONS_FILTER: string[]) => TRANSITIONS_FILTER.filter((x) => canSetStatus(me.role, x));
  const { id } = await params;
  const data = await getOrderFull(id);
  if (!data) notFound();
  const { o, items, history, notes, blocked, prior } = data;
  const vis = o.visitor_id ? await getEnv().DB.prepare("SELECT v.id, v.fp, v.country, v.city, v.browser, v.os, v.device, v.ip, v.visits, ((SELECT 1 FROM blocked_signals s WHERE s.visitor_id = v.id LIMIT 1) OR (SELECT 1 FROM blocked_fingerprints b WHERE b.fp = v.fp)) AS blocked, (SELECT COUNT(*) FROM visitors x WHERE x.fp = v.fp AND x.id != v.id) AS others FROM visitors v WHERE v.id = ?").bind(o.visitor_id).first<{ id: string; fp: string | null; country: string | null; city: string | null; browser: string | null; os: string | null; device: string | null; ip: string | null; visits: number; blocked: number | null; others: number }>() : null;
  const s = await getSettings();
  const cur = o.currency as string;
  const fmt = (n: number) => formatMoney(n, cur, "en");
  const status = o.status as OrderStatus;
  const labels = Object.fromEntries(ORDER_STATUSES.map((x) => [x, statusInfo(s, x, "en").label]));
  const info = statusInfo(s, status, "en");
  const lang = (o.lang as string | null) ?? s.store.defaultLang;
  const vars = { name: o.name as string, store: s.store.name, order: `#${o.number}`, total: formatMoney(o.total as number, cur, lang), tracking: (o.tracking_number as string) ?? "" };
  const confirmMsg = fill(tr(s.templates.confirm, lang), vars);
  const shippedMsg = fill(tr(s.templates.shipped, lang), vars);
  const deliveredMsg = fill(tr(s.templates.delivered, lang), vars);
  const carriers = (await listCarriers().catch(() => [])).filter((c) => c.enabled);
  const cityRow = o.city_id ? await getEnv().DB.prepare("SELECT default_carrier FROM cities WHERE id = ?").bind(o.city_id).first<{ default_carrier: string | null }>() : null;
  const risky = prior.returned > 0 || blocked || (prior.n > 0 && prior.delivered === 0);

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4 rtl:rotate-180" />Orders</Link>
      <PageHeader
        title={`Order #${o.number}`}
        sub={`Placed ${new Date(o.created_at as number).toLocaleString("en-GB")} · ${o.source ?? "storefront"}`}
        actions={<>
          <Badge color={info.color}>{info.label}</Badge>
          <Link target="_blank" href={`/admin/invoice/${o.id}?type=invoice`} className="btn btn-outline btn-sm"><FileText className="size-4" />Invoice</Link>
          <Link target="_blank" href={`/admin/invoice/${o.id}?type=slip`} className="btn btn-outline btn-sm"><Printer className="size-4" />Packing slip</Link>
        </>}
      />
      {risky && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-accent/50 bg-accent/10 p-3 text-sm font-medium"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
          {blocked ? "This phone is on the blocklist." : prior.returned > 0 ? `This customer has ${prior.returned} returned order(s).` : `This customer has ${prior.n} earlier order(s) and none delivered.`}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-5">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {i.image ? <img src={fileUrl(i.image)} alt="" className="size-14 rounded-lg object-cover" /> : <div className="size-14 rounded-lg bg-sunken" />}
                  <div className="min-w-0 flex-1"><p className="font-semibold">{tr(i.name, "en")}</p><p className="text-xs text-muted">{[i.variant_name, i.sku].filter(Boolean).join(" · ")}</p></div>
                  <p className="num text-sm text-muted">{i.qty} × {fmt(i.price)}</p>
                  <p className="num w-24 text-end font-bold">{fmt(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="num mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{fmt(o.subtotal as number)}</dd></div>
              {(o.discount as number) > 0 && <div className="flex justify-between text-ok"><dt>Discount {o.coupon_code ? `(${o.coupon_code})` : ""}</dt><dd>−{fmt(o.discount as number)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{fmt(o.shipping as number)}</dd></div>
              {(o.cod_fee as number) > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{fmt(o.cod_fee as number)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-2 text-lg font-extrabold"><dt>Total to collect</dt><dd>{fmt(o.total as number)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Status">
            {mayStatus(TRANSITIONS[status] ?? []).length > 0 ? <StatusPanel id={o.id as string} allowed={mayStatus(TRANSITIONS[status] ?? [])} labels={labels} current={status} /> : <p className="text-sm text-muted">Your role can’t change the status of this order.</p>}
            {status === "postponed" && o.postpone_until && <p className="mt-3 text-sm text-muted">Postponed until {new Date(o.postpone_until as number).toLocaleString("en-GB")}</p>}
            {(o.attempts as number) > 0 && <p className="mt-3 text-sm font-semibold">No-answer attempts: <span className="num">{o.attempts as number}</span></p>}
          </Panel>

          <Panel title="Timeline"><OrderTimeline history={history} current={status} s={s} /></Panel>

          <Panel title="Internal notes">
            {can(me.role, "orders.note") && <NoteForm id={o.id as string} />}
            <ul className="mt-4 space-y-3">{notes.map((n) => <li key={n.id} className="rounded-lg bg-sunken p-3 text-sm"><p>{n.body}</p><p className="mt-1 text-xs text-muted">{n.user_name} · {new Date(n.created_at).toLocaleString("en-GB")}</p></li>)}</ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Customer">
            <p className="text-lg font-bold">{o.name as string}</p>
            <p dir="ltr" className="num text-start text-muted">+{o.phone as string}</p>
            <p className="mt-3 text-sm">{o.address as string}</p>
            <p className="text-sm font-semibold">{o.city as string}, {o.country as string}</p>
            {o.notes && <p className="mt-3 rounded-lg bg-sunken p-3 text-sm">“{o.notes as string}”</p>}
            <p className="mt-3 text-xs text-muted">Earlier orders: {prior.n} · delivered {prior.delivered} · returned {prior.returned}</p>
            <div className="mt-4 grid gap-2">
              <a className="btn btn-outline btn-sm" href={`tel:+${o.phone}`}><Phone className="size-4" />Call</a>
              <a className="btn btn-sm bg-[#25D366] text-white hover:opacity-90" target="_blank" rel="noopener noreferrer" href={whatsappLink(o.phone as string, confirmMsg)}><MessageCircle className="size-4" />WhatsApp: confirm order</a>
              {status === "shipped" || status === "out_for_delivery" ? <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" href={whatsappLink(o.phone as string, shippedMsg)}><MessageCircle className="size-4" />WhatsApp: shipped</a> : null}
              {status === "delivered" ? <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer" href={whatsappLink(o.phone as string, deliveredMsg)}><MessageCircle className="size-4" />WhatsApp: thank you</a> : null}
              {can(me.role, "customers.block") && <BlockPhone phone={o.phone as string} blocked={blocked} />}
            </div>
            {can(me.role, "orders.confirm") && <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-brand">Edit address</summary><div className="mt-3"><EditOrderForm o={{ id: o.id as string, name: o.name as string, address: o.address as string, city: o.city as string, notes: (o.notes as string) ?? "" }} /></div></details>}
          </Panel>
          {vis && can(me.role, "visitors.view") && <Panel title="Visitor">
            <p className="text-sm font-semibold">{[vis.city, vis.country].filter(Boolean).join(", ") || "Location unknown"}</p>
            <p className="text-sm text-muted">{[vis.browser, vis.os, vis.device].filter(Boolean).join(" · ")}</p>
            <p className="mt-1 text-xs text-muted">IP <span dir="ltr">{vis.ip ?? "—"}</span> · {vis.visits} visit{vis.visits === 1 ? "" : "s"}</p>
            {vis.others > 0 && <p className="mt-2 rounded-lg bg-warn/10 p-2 text-xs font-semibold">This device also appears under {vis.others} other visitor id{vis.others === 1 ? "" : "s"}.</p>}
            {vis.blocked ? <p className="mt-2"><Badge color="#dc2626">Device blocked</Badge></p> : null}
            <Link href={`/admin/visitors/${vis.id}`} className="mt-3 inline-block text-sm font-semibold text-brand underline">Open visitor profile</Link>
          </Panel>}
          {(can(me.role, "orders.fulfil") || !!o.tracking_number) && <Panel title="Shipping">
            {o.tracking_number && <p className="mb-3 text-sm">Carrier <b className="capitalize">{o.carrier_id as string}</b> · <span dir="ltr" className="num font-bold">{o.tracking_number as string}</span>{o.label_key ? <> · <a className="font-semibold text-brand underline" href={`/api/carriers/labels/${o.number}`}>Label PDF</a></> : null}</p>}
            {can(me.role, "orders.fulfil") && <CarrierPanel orderId={o.id as string} status={status} carrierId={o.carrier_id as string | null} tracking={o.tracking_number as string | null} error={o.shipment_error as string | null} carriers={carriers.map((c) => ({ id: c.id, name: c.name, hasApi: c.hasApi }))} defaultCarrier={cityRow?.default_carrier ?? null} feeMajor={toMajorString(o.carrier_fee as number, cur)} />}
          </Panel>}
        </div>
      </div>
    </>
  );
}
