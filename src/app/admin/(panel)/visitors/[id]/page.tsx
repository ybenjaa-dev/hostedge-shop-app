import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { PageHeader, Panel, Badge } from "@/features/admin/components/ui";
import { ActionButton } from "@/features/settings/components/action-button";
import { DataTable, Td } from "@/features/settings/components/table";
import { blockFingerprint, unblockFingerprint } from "@/features/visitors/actions";
import { formatPhoneIntl } from "@/lib/phone";

export const metadata = { title: "Visitor" };
type V = Record<string, string | number | null>;
const when = (t: number | null) => (t ? new Date(Number(t)).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default async function VisitorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }] = [await params, await requirePerm("visitors.view")];
  await ensureSchema();
  const db = getEnv().DB;
  const v = await db.prepare("SELECT * FROM visitors WHERE id = ?").bind(id).first<V>();
  if (!v) notFound();
  const fp = v.fp ? String(v.fp) : null;
  const [orders, same, blocked] = await db.batch([
    db.prepare("SELECT number, status, total, currency, created_at AS at FROM orders WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 20").bind(id),
    fp ? db.prepare("SELECT id, city, country, phone, orders, last_seen AS lastSeen FROM visitors WHERE fp = ? AND id != ? ORDER BY last_seen DESC LIMIT 20").bind(fp, id) : db.prepare("SELECT 1 WHERE 0"),
    db.prepare("SELECT reason FROM blocked_fingerprints WHERE fp = ?").bind(fp ?? ""),
  ]);
  const isBlocked = blocked!.results.length > 0;
  let utm: Record<string, string> = {}; try { utm = JSON.parse(String(v.utm ?? "{}")) as Record<string, string>; } catch { /* none */ }
  const rows: [string, React.ReactNode][] = [
    ["Device id", fp ? <code dir="ltr" className="break-all text-xs">{fp}</code> : "— (no consent / no JavaScript)"],
    ["IP address", <span dir="ltr" key="ip">{String(v.ip ?? "—")}</span>],
    ["Location", [v.city, v.region, v.country].filter(Boolean).join(", ") || "—"],
    ["Coordinates (approx.)", v.latitude ? <span dir="ltr" key="c">{String(v.latitude)}, {String(v.longitude)}</span> : "—"],
    ["Network", String(v.network ?? "—")], ["Time zone", String(v.timezone ?? "—")],
    ["Browser / OS", [v.browser, v.os].filter(Boolean).join(" · ") || "—"], ["Device / screen", [v.device, v.screen].filter(Boolean).join(" · ") || "—"], ["Language", String(v.lang ?? "—")],
    ["First seen", when(v.first_seen as number)], ["Last seen", when(v.last_seen as number)], ["Visits / page views", `${v.visits} / ${v.page_views}`],
    ["Came from", String(v.referrer || "direct")], ["Landing page", <span dir="ltr" key="l">{String(v.landing ?? "—")}</span>],
    ["Campaign", Object.keys(utm).length ? Object.entries(utm).map(([k, x]) => `${k}=${x}`).join("  ") : "—"],
    ["Phone", v.phone ? <span dir="ltr" key="p">{formatPhoneIntl(String(v.phone))}</span> : "—"], ["Push notifications", v.push ? "Subscribed" : "No"],
  ];
  return (
    <div>
      <PageHeader title="Visitor" sub={fp ? `Device ${fp.slice(0, 10)}…` : "Anonymous"} actions={<Link href="/admin/visitors" className="btn btn-outline btn-sm">← All visitors</Link>} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Details"><dl className="divide-y divide-line text-sm">{rows.map(([k, val]) => <div key={k} className="grid grid-cols-[10rem_1fr] gap-3 py-2"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words font-medium">{val}</dd></div>)}</dl></Panel>
        <div className="space-y-6">
          <Panel title="Fraud control">
            {isBlocked && <p className="mb-3"><Badge color="#dc2626">Device blocked</Badge></p>}
            {fp ? (isBlocked
              ? <ActionButton action={unblockFingerprint} fields={{ fp }} confirm="Allow this device to order again?">Unblock this device</ActionButton>
              : <ActionButton action={blockFingerprint} fields={{ fp }} confirm="Block this device from placing orders? It stays blocked even with a different phone number." className="btn btn-outline btn-sm !border-danger !text-danger">Block this device</ActionButton>)
              : <p className="text-sm text-muted">No fingerprint recorded.</p>}
          </Panel>
          <Panel title="Orders">
            {orders!.results.length === 0 ? <p className="text-sm text-muted">No orders from this visitor.</p> : <ul className="space-y-1 text-sm">{(orders!.results as { number: string; status: string; total: number; currency: string; at: number }[]).map((o) => <li key={o.number}><Link href={`/admin/orders?q=${o.number}`} className="font-semibold hover:underline">#{o.number}</Link> <span className="text-muted">· {o.status} · {when(o.at)}</span></li>)}</ul>}
          </Panel>
        </div>
      </div>
      {fp && same!.results.length > 0 && (
        <Panel title="Same device, other visits" className="mt-6">
          <p className="mb-3 text-sm text-muted">Same fingerprint with another cookie — often someone clearing cookies or creating fake orders.</p>
          <DataTable head={["Visitor", "Location", "Phone", "Orders", "Last seen"]}>
            {(same!.results as { id: string; city: string | null; country: string | null; phone: string | null; orders: number; lastSeen: number }[]).map((s) => (
              <tr key={s.id}><Td><Link href={`/admin/visitors/${s.id}`} className="font-mono text-xs hover:underline">{s.id.slice(0, 10)}</Link></Td><Td>{s.city ?? s.country ?? "—"}</Td><Td className="num" ><span dir="ltr">{s.phone ? formatPhoneIntl(s.phone) : "—"}</span></Td><Td className="num">{s.orders}</Td><Td className="num text-muted">{when(s.lastSeen)}</Td></tr>
            ))}
          </DataTable>
        </Panel>
      )}
    </div>
  );
}
