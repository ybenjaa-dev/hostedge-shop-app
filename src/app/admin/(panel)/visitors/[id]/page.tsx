import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, ExternalLink, Globe2, MapPin, Monitor, ShieldAlert, Smartphone, Tablet, Users } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { statusInfo } from "@/lib/status-labels";
import { flagEmoji } from "@/lib/lang-presets";
import { formatPhoneIntl } from "@/lib/phone";
import { Badge, PageHeader, Panel, Stat } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { BlockDevice } from "@/features/visitors/components/block-device";

export const metadata = { title: "Visitor" };
type V = Record<string, string | number | null>;
const when = (t: number | string | null) => (t ? new Date(Number(t)).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const ago = (t: number) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const Row = ({ k, children }: { k: string; children: React.ReactNode }) => <div className="grid grid-cols-[8.5rem_1fr] gap-3 py-2.5 text-sm"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words font-medium">{children}</dd></div>;

export default async function VisitorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, me] = [await params, await requirePerm("visitors.view")];
  await ensureSchema();
  const db = getEnv().DB;
  const v = await db.prepare("SELECT * FROM visitors WHERE id = ?").bind(id).first<V>();
  if (!v) notFound();
  const s = await getSettings();
  const fp = v.fp ? String(v.fp) : null, ip = v.ip ? String(v.ip) : null, phone = v.phone ? String(v.phone) : null;
  const [orders, sameDevice, sameIp, block, push, customer] = await db.batch([
    db.prepare("SELECT id, number, status, total, created_at AS at FROM orders WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 20").bind(id),
    fp ? db.prepare("SELECT id, city, country, phone, orders, last_seen AS lastSeen FROM visitors WHERE fp = ? AND id != ? ORDER BY last_seen DESC LIMIT 20").bind(fp, id) : db.prepare("SELECT 1 WHERE 0"),
    ip ? db.prepare("SELECT id, fp, city, country, browser, os, orders, last_seen AS lastSeen FROM visitors WHERE ip = ? AND id != ? AND (fp IS NULL OR fp != ?) ORDER BY last_seen DESC LIMIT 20").bind(ip, id, fp ?? "") : db.prepare("SELECT 1 WHERE 0"),
    db.prepare("SELECT reason, created_at AS at FROM blocked_fingerprints WHERE fp = ?").bind(fp ?? ""),
    db.prepare("SELECT created_at AS at, last_sent_at AS sent, active FROM push_subscriptions WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 1").bind(id),
    phone ? db.prepare("SELECT id, name, orders_count AS n, total_spent AS spent FROM customers WHERE phone = ?").bind(phone) : db.prepare("SELECT 1 WHERE 0"),
  ]);
  const blocked = block!.results[0] as { reason: string | null; at: number } | undefined;
  const cust = customer!.results[0] as { id: string; name: string; n: number; spent: number } | undefined;
  const ps = push!.results[0] as { at: number; sent: number | null; active: number } | undefined;
  const dev = String(v.device ?? "");
  const DevIcon = dev === "mobile" ? Smartphone : dev === "tablet" ? Tablet : Monitor;
  let utm: Record<string, string> = {}; try { utm = JSON.parse(String(v.utm ?? "{}")) as Record<string, string>; } catch { /* none */ }
  const lat = v.latitude ? Number(v.latitude) : null, lon = v.longitude ? Number(v.longitude) : null;
  const orderRows = orders!.results as { id: string; number: string; status: string; total: number; at: number }[];
  const spent = orderRows.reduce((a, o) => a + o.total, 0);
  const place = [v.city, v.region, v.country].filter(Boolean).join(", ");
  const risky = (sameDevice!.results.length > 0 || sameIp!.results.length > 2) && !blocked;
  return (
    <div>
      <PageHeader title="Visitor" sub={fp ? `Device ${fp.slice(0, 12)}…` : "Anonymous visitor"} actions={<Link href="/admin/visitors" className="btn btn-outline btn-sm">← All visitors</Link>} />

      <div className="card mb-5 flex flex-wrap items-center gap-4 p-5">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sunken text-3xl" aria-hidden>{v.country ? flagEmoji(String(v.country)) : "🌐"}</span>
        <div className="min-w-0 flex-1">
          <p className="display text-xl font-extrabold">{place || "Location unknown"}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><DevIcon className="size-4" aria-hidden />{[v.browser, v.os].filter(Boolean).join(" · ") || "Unknown device"}</span>
            {v.screen && <span className="num">{String(v.screen)}</span>}
            <span>Last seen {ago(Number(v.last_seen))}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {blocked && <Badge color="#dc2626">Blocked</Badge>}
          {Number(v.orders) > 0 && <Badge color="#16a34a">Customer</Badge>}
          {ps?.active ? <Badge color="#0d9488">Push on</Badge> : null}
          {risky && <Badge color="#d97706">Check device</Badge>}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Visits" value={String(v.visits)} sub={`${v.page_views} page views`} />
        <Stat label="Orders" value={String(orderRows.length)} sub={orderRows.length ? formatMoney(spent, s.store.currency, "en") : "never ordered"} tone={orderRows.length ? "ok" : undefined} />
        <Stat label="First seen" value={<span className="text-lg">{when(v.first_seen as number).split(",")[0]}</span>} sub={when(v.first_seen as number).split(",").slice(1).join(",")} />
        <Stat label="Language" value={<span className="uppercase">{String(v.lang ?? "—")}</span>} sub={v.timezone ? String(v.timezone) : undefined} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Panel title="Where they come from">
            <dl className="divide-y divide-line">
              <Row k="Came from">{v.referrer ? <span dir="ltr" className="break-all">{String(v.referrer)}</span> : "Direct"}</Row>
              <Row k="Landing page"><span dir="ltr">{String(v.landing ?? "—")}</span></Row>
              <Row k="Campaign">{Object.keys(utm).length ? <span className="flex flex-wrap gap-1.5">{Object.entries(utm).map(([k, x]) => <span key={k} className="rounded-full bg-sunken px-2 py-0.5 text-xs" dir="ltr"><b>{k.replace("utm_", "")}</b> {x}</span>)}</span> : "—"}</Row>
            </dl>
          </Panel>
          <Panel title="Location & network">
            <dl className="divide-y divide-line">
              <Row k="IP address"><span dir="ltr" className="num">{ip ?? "—"}</span></Row>
              <Row k="Location"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-muted" aria-hidden />{place || "—"}</span></Row>
              {lat != null && lon != null && <Row k="Map"><a className="inline-flex items-center gap-1 font-semibold text-brand underline" target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`}><Globe2 className="size-4" aria-hidden />Open on map <span className="text-xs font-normal text-muted num">(approx. {lat.toFixed(2)}, {lon.toFixed(2)})</span><ExternalLink className="size-3.5" aria-hidden /></a></Row>}
              <Row k="Network">{String(v.network ?? "—")}</Row>
              <Row k="Time zone">{String(v.timezone ?? "—")}</Row>
            </dl>
          </Panel>
          <Panel title="Device">
            <dl className="divide-y divide-line">
              <Row k="Device id">{fp ? <code dir="ltr" className="break-all text-xs">{fp}</code> : "— (no consent)"}</Row>
              <Row k="Browser / system">{[v.browser, v.os].filter(Boolean).join(" · ") || "—"}</Row>
              <Row k="Type · screen"><span className="capitalize">{dev || "—"}</span> · <span className="num">{String(v.screen ?? "—")}</span></Row>
              <Row k="User agent"><span dir="ltr" className="break-all text-xs text-muted">{String(v.ua ?? "—")}</span></Row>
            </dl>
          </Panel>
          {sameDevice!.results.length > 0 && (
            <Panel title={`Same device, ${sameDevice!.results.length} other visit${sameDevice!.results.length === 1 ? "" : "s"}`}>
              <p className="mb-3 text-sm text-muted">Same fingerprint with a different cookie — often someone clearing cookies to order again.</p>
              <DataTable head={["Visitor", "Location", "Phone", "Orders", "Last seen"]}>
                {(sameDevice!.results as { id: string; city: string | null; country: string | null; phone: string | null; orders: number; lastSeen: number }[]).map((x) => (
                  <tr key={x.id}><Td><Link href={`/admin/visitors/${x.id}`} className="font-mono text-xs hover:underline">{x.id.slice(0, 10)}</Link></Td><Td>{x.city ?? x.country ?? "—"}</Td><Td className="num"><span dir="ltr">{x.phone ? formatPhoneIntl(x.phone) : "—"}</span></Td><Td className="num">{x.orders}</Td><Td className="num text-muted">{when(x.lastSeen)}</Td></tr>
                ))}
              </DataTable>
            </Panel>
          )}
          {sameIp!.results.length > 0 && (
            <Panel title={`Same IP address, ${sameIp!.results.length} other device${sameIp!.results.length === 1 ? "" : "s"}`}>
              <p className="mb-3 text-sm text-muted">Other devices seen from <span dir="ltr" className="num">{ip}</span> — a family or office, or one person using several devices.</p>
              <DataTable head={["Device", "Browser", "Orders", "Last seen"]}>
                {(sameIp!.results as { id: string; fp: string | null; browser: string | null; os: string | null; orders: number; lastSeen: number }[]).map((x) => (
                  <tr key={x.id}><Td><Link href={`/admin/visitors/${x.id}`} className="font-mono text-xs hover:underline">{(x.fp ?? x.id).slice(0, 10)}</Link></Td><Td>{[x.browser, x.os].filter(Boolean).join(" · ")}</Td><Td className="num">{x.orders}</Td><Td className="num text-muted">{when(x.lastSeen)}</Td></tr>
                ))}
              </DataTable>
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          {can(me.role, "customers.block") && (
            <Panel title="Fraud control">
              {blocked ? (
                <div className="mb-3 rounded-xl bg-danger/10 p-3 text-sm"><p className="flex items-center gap-2 font-bold text-danger"><ShieldAlert className="size-4" aria-hidden />Blocked on {when(blocked.at)}</p>{blocked.reason && <p className="mt-1 text-muted">“{blocked.reason}”</p>}<p className="mt-1 text-xs text-muted">This device can’t open the shop or place orders.</p></div>
              ) : <p className="mb-3 text-sm text-muted">Blocking shuts this device out of the shop and checkout, even with a new phone number or cleared cookies.</p>}
              {fp ? <BlockDevice fp={fp} blocked={!!blocked} /> : <p className="text-sm text-muted">No device id was recorded, so this visitor can’t be blocked by device.</p>}
            </Panel>
          )}
          <Panel title="Orders">
            {orderRows.length === 0 ? <p className="text-sm text-muted">No orders from this visitor.</p> : (
              <ul className="divide-y divide-line">{orderRows.map((o) => { const st = statusInfo(s, o.status, "en"); return (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span><Link href={`/admin/orders/${o.id}`} className="font-bold hover:underline">#{o.number}</Link><span className="block text-xs text-muted">{when(o.at)}</span></span><span className="text-end"><span className="num block font-semibold">{formatMoney(o.total, s.store.currency, "en")}</span><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${st.color}1f`, color: st.color }}>{st.label}</span></span></li>); })}</ul>
            )}
          </Panel>
          {(phone || cust) && (
            <Panel title="Customer">
              {cust ? <><Link href={`/admin/customers/${cust.id}`} className="inline-flex items-center gap-2 font-bold hover:underline"><Users className="size-4" aria-hidden />{cust.name}</Link><p className="mt-1 text-sm text-muted">{cust.n} order{cust.n === 1 ? "" : "s"} · {formatMoney(cust.spent, s.store.currency, "en")}</p></> : null}
              {phone && <p className="mt-2 text-sm" dir="ltr"><a className="num font-semibold" href={`tel:+${phone}`}>{formatPhoneIntl(phone)}</a></p>}
            </Panel>
          )}
          <Panel title="Notifications">
            <p className="flex items-center gap-2 text-sm"><Bell className="size-4 text-muted" aria-hidden />{ps ? (ps.active ? "Subscribed to push" : "Subscription inactive") : "Not subscribed to push"}</p>
            {ps && <p className="mt-1 text-xs text-muted">Since {when(ps.at)}{ps.sent ? ` · last message ${ago(ps.sent)}` : ""}</p>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
