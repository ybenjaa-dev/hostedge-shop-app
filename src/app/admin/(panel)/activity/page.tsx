import { DateRangeField } from "@/features/admin/components/date-picker";
import Link from "next/link";
import { and, desc, gte, lte, eq, sql } from "drizzle-orm";
import { requirePerm } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { Empty, PageHeader, Pager, FilterBar, FbItem } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { one, pageNum } from "@/features/settings/lib";

export const metadata = { title: "Activity log" };
const PER = 50;
const dateMs = (v: string, end: boolean) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? Date.parse(`${v}T${end ? "23:59:59.999" : "00:00:00.000"}Z`) : NaN);

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePerm("activity.view");
  const sp = await searchParams;
  const user = one(sp.user).slice(0, 40), action = one(sp.action).trim().slice(0, 40), from = one(sp.from), to = one(sp.to);
  const page = pageNum(sp.page);
  const f = dateMs(from, false), t = dateMs(to, true);
  const esc = action.replace(/[\\%_]/g, (c) => `\\${c}`);
  const where = and(
    user ? eq(schema.activityLog.userName, user) : undefined,
    action ? sql`${schema.activityLog.action} LIKE ${esc + "%"} ESCAPE '\\'` : undefined,
    Number.isNaN(f) ? undefined : gte(schema.activityLog.createdAt, f),
    Number.isNaN(t) ? undefined : lte(schema.activityLog.createdAt, t),
  );
  const db = getDb();
  const [rows, total, users] = await Promise.all([
    db.select().from(schema.activityLog).where(where).orderBy(desc(schema.activityLog.createdAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)` }).from(schema.activityLog).where(where).get(),
    db.selectDistinct({ n: schema.activityLog.userName }).from(schema.activityLog),
  ]);
  const filtered = !!(user || action || from || to);
  return (
    <div>
      <PageHeader title="Activity log" sub="Who changed what, and when." />
      <FilterBar actions={<><button className="btn btn-primary">Filter</button>{filtered && <Link href="/admin/activity" className="btn btn-outline">Clear</Link>}</>}>
        <FbItem label="User"><select id="f-user" name="user" defaultValue={user} className="field"><option value="">Everyone</option>{users.map((u) => u.n && <option key={u.n} value={u.n}>{u.n}</option>)}</select></FbItem>
        <FbItem label="Action starts with"><input id="f-action" name="action" defaultValue={action} placeholder="order. / settings." className="field" dir="ltr" /></FbItem>
        <FbItem wide><DateRangeField from={from} to={to} label="Date range" /></FbItem>
      </FilterBar>
      {rows.length === 0 ? <Empty title="No activity found" hint={filtered ? "Try widening the filters." : "Changes made in the admin will be listed here."} /> : (
        <DataTable head={["When", "User", "Action", "Target", "Details"]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td className="num whitespace-nowrap text-muted">{new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</Td>
              <Td className="font-semibold">{r.userName || "system"}</Td>
              <Td><code className="rounded bg-sunken px-1.5 py-0.5 text-xs font-bold" dir="ltr">{r.action}</code></Td>
              <Td className="text-muted"><span dir="ltr">{r.entity}{r.entityId ? ` · ${r.entityId.length > 14 ? r.entityId.slice(0, 14) + "…" : r.entityId}` : ""}</span></Td>
              <Td className="max-w-xs truncate text-xs text-muted" ><span title={r.meta ?? ""} dir="ltr">{r.meta ?? ""}</span></Td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil((total?.n ?? 0) / PER))} base="/admin/activity" params={{ user, action, from, to }} />
    </div>
  );
}
