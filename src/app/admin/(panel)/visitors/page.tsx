import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { PageHeader, Badge, Empty, Pager, FilterBar, FbItem, Stat } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { one, pageNum } from "@/features/settings/lib";
import { formatPhoneIntl } from "@/lib/phone";

export const metadata = { title: "Visitors" };
const PER = 30;
type Row = { id: string; fp: string | null; country: string | null; city: string | null; browser: string | null; os: string | null; device: string | null; visits: number; pageViews: number; orders: number; push: number; lastSeen: number; phone: string | null; blocked: number };

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePerm("visitors.view");
  await ensureSchema();
  const sp = await searchParams;
  const db = getEnv().DB;
  const q = one(sp.q).trim().slice(0, 60), country = one(sp.country).toUpperCase().slice(0, 2), device = one(sp.device), push = one(sp.push), conv = one(sp.conv);
  const page = pageNum(sp.page);
  const w: string[] = ["1=1"]; const a: unknown[] = [];
  if (q) { w.push("(v.ip LIKE ? OR v.city LIKE ? OR v.phone LIKE ? OR v.fp LIKE ? OR v.id = ?)"); a.push(`%${q}%`, `%${q}%`, `%${q.replace(/\D/g, "") || "—"}%`, `${q}%`, q); }
  if (/^[A-Z]{2}$/.test(country)) { w.push("v.country = ?"); a.push(country); }
  if (["mobile", "tablet", "desktop"].includes(device)) { w.push("v.device = ?"); a.push(device); }
  if (push === "1") w.push("v.push = 1");
  if (conv === "1") w.push("v.orders > 0"); if (conv === "0") w.push("v.orders = 0");
  const where = w.join(" AND ");
  const [rows, total, stats, countries] = await db.batch([
    db.prepare(`SELECT v.id, v.fp, v.country, v.city, v.browser, v.os, v.device, v.visits, v.page_views AS pageViews, v.orders, v.push, v.last_seen AS lastSeen, v.phone,
        (SELECT 1 FROM blocked_fingerprints b WHERE b.fp = v.fp) AS blocked FROM visitors v WHERE ${where} ORDER BY v.last_seen DESC LIMIT ? OFFSET ?`).bind(...a, PER, (page - 1) * PER),
    db.prepare(`SELECT COUNT(*) AS n FROM visitors v WHERE ${where}`).bind(...a),
    db.prepare("SELECT COUNT(*) AS n, SUM(push) AS push, SUM(orders > 0) AS buyers, SUM(last_seen > ?) AS today FROM visitors").bind(Date.now() - 864e5),
    db.prepare("SELECT DISTINCT country AS v FROM visitors WHERE country IS NOT NULL ORDER BY 1 LIMIT 80"),
  ]);
  const st = stats!.results[0] as { n: number; push: number | null; buyers: number | null; today: number | null };
  const n = (total!.results[0] as { n: number }).n;
  const flag = (c: string | null) => (c && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((x) => 127397 + x.charCodeAt(0))) : "🌐");
  return (
    <div>
      <PageHeader title="Visitors" sub="People who accepted the privacy notice: where they come from, what device they use, whether they ordered." />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Visitors" value={String(st.n)} /><Stat label="Active in 24 h" value={String(st.today ?? 0)} /><Stat label="Ordered" value={String(st.buyers ?? 0)} /><Stat label="Push subscribers" value={String(st.push ?? 0)} />
      </div>
      <FilterBar actions={<><button className="btn btn-primary">Filter</button>{(q || country || device || push || conv) && <Link href="/admin/visitors" className="btn btn-outline">Clear</Link>}</>}>
        <FbItem grow><input name="q" defaultValue={q} placeholder="IP, city, phone, device id…" aria-label="Search visitors" className="field" /></FbItem>
        <FbItem><select name="country" defaultValue={country} className="field" aria-label="Country"><option value="">All countries</option>{(countries!.results as { v: string }[]).map((c) => <option key={c.v} value={c.v}>{flag(c.v)} {c.v}</option>)}</select></FbItem>
        <FbItem><select name="device" defaultValue={device} className="field" aria-label="Device"><option value="">All devices</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option><option value="desktop">Desktop</option></select></FbItem>
        <FbItem><select name="conv" defaultValue={conv} className="field" aria-label="Orders"><option value="">Ordered or not</option><option value="1">Ordered</option><option value="0">Never ordered</option></select></FbItem>
        <FbItem><select name="push" defaultValue={push} className="field" aria-label="Push"><option value="">Push or not</option><option value="1">Push on</option></select></FbItem>
      </FilterBar>
      {n === 0 ? <Empty title="No visitors yet" hint="Visitors appear here once they accept the privacy notice on the shop." /> : (
        <DataTable minWidth="52rem" head={["Visitor", "Location", "Device", "Visits", "Orders", "Push", "Last seen"]}>
          {(rows!.results as Row[]).map((v) => (
            <tr key={v.id} className="hover:bg-sunken/40">
              <Td><Link href={`/admin/visitors/${v.id}`} className="font-mono text-xs font-semibold hover:underline" dir="ltr">{v.fp ? v.fp.slice(0, 10) : v.id.slice(0, 10)}</Link>{v.blocked ? <> <Badge color="#dc2626">Blocked</Badge></> : null}{v.phone && <div className="num text-xs text-muted" dir="ltr">{formatPhoneIntl(v.phone)}</div>}</Td>
              <Td>{flag(v.country)} {v.city ?? v.country ?? "—"}</Td>
              <Td className="text-sm">{[v.browser, v.os].filter(Boolean).join(" · ") || "—"}<div className="text-xs capitalize text-muted">{v.device}</div></Td>
              <Td className="num">{v.visits}<span className="text-xs text-muted"> / {v.pageViews} pages</span></Td>
              <Td className={`num ${v.orders ? "font-bold text-ok" : "text-muted"}`}>{v.orders}</Td>
              <Td>{v.push ? <Badge color="#0d9488">On</Badge> : <span className="text-muted">—</span>}</Td>
              <Td className="num whitespace-nowrap text-muted">{new Date(v.lastSeen).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil(n / PER))} base="/admin/visitors" params={{ q, country, device, push, conv }} />
    </div>
  );
}
