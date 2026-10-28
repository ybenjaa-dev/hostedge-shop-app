import Link from "next/link";
import { desc, inArray, like, or, sql } from "drizzle-orm";
import { requirePerm } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { formatPhoneIntl, latinDigits } from "@/lib/phone";
import { Badge, Empty, PageHeader, Pager, FilterBar, FbItem } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { Tabs } from "@/features/settings/components/tabs";
import { ActionButton } from "@/features/settings/components/action-button";
import { one, pageNum } from "@/features/settings/lib";
import { unblockPhone } from "@/features/crm/actions";
import { BlockForm } from "@/features/crm/components/block-form";

export const metadata = { title: "Customers" };
const PER = 25;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePerm("customers.view");
  const sp = await searchParams;
  const tab = one(sp.tab) === "blocked" ? "blocked" : "customers";
  const s = await getSettings();
  const db = getDb();

  if (tab === "blocked") {
    const rows = await db.select().from(schema.blockedPhones).orderBy(desc(schema.blockedPhones.createdAt));
    return (
      <div>
        <PageHeader title="Customers" sub="Blocked numbers cannot place orders." />
        <Tabs base="/admin/customers" current="blocked" items={[{ id: "customers", label: "Customers" }, { id: "blocked", label: "Blocked numbers" }]} />
        <div className="space-y-6">
          <section className="card p-5"><h2 className="display mb-4 text-lg font-extrabold">Block a number</h2><BlockForm /></section>
          {rows.length === 0 ? <Empty title="No blocked numbers" hint="Block fake or abusive numbers here, or from a customer's page." /> : (
            <DataTable head={["Phone", "Reason", "Blocked on", ""]}>
              {rows.map((b) => (
                <tr key={b.phone}>
                  <Td className="num font-semibold" ><span dir="ltr">{formatPhoneIntl(b.phone)}</span></Td>
                  <Td className="text-muted">{b.reason || "—"}</Td>
                  <Td className="num text-muted">{new Date(b.createdAt).toLocaleDateString("en-GB")}</Td>
                  <Td><div className="flex justify-end"><ActionButton action={unblockPhone} fields={{ phone: b.phone }} confirm={`Unblock ${formatPhoneIntl(b.phone)}?`}>Unblock</ActionButton></div></Td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    );
  }

  const q = one(sp.q).trim().slice(0, 60);
  const page = pageNum(sp.page);
  const digits = latinDigits(q).replace(/\D/g, "");
  const where = q ? or(like(schema.customers.name, `%${q}%`), digits.length >= 3 ? like(schema.customers.phone, `%${digits.replace(/^0+/, "")}%`) : undefined) : undefined;
  const [rows, total] = await Promise.all([
    db.select().from(schema.customers).where(where).orderBy(desc(schema.customers.lastOrderAt), desc(schema.customers.createdAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)` }).from(schema.customers).where(where).get(),
  ]);
  const blocked = new Set(rows.length ? (await db.select({ p: schema.blockedPhones.phone }).from(schema.blockedPhones).where(inArray(schema.blockedPhones.phone, rows.map((r) => r.phone)))).map((b) => b.p) : []);
  return (
    <div>
      <PageHeader title="Customers" sub={`${total?.n ?? 0} customer${total?.n === 1 ? "" : "s"}`} />
      <Tabs base="/admin/customers" current="customers" items={[{ id: "customers", label: "Customers" }, { id: "blocked", label: "Blocked numbers" }]} />
      <FilterBar actions={<><button className="btn btn-primary">Search</button>{q && <Link href="/admin/customers" className="btn btn-outline">Clear</Link>}</>}>
        <FbItem grow><input name="q" defaultValue={q} placeholder="Search by name or phone…" aria-label="Search customers" className="field" /></FbItem>
      </FilterBar>
      {rows.length === 0 ? <Empty title={q ? "No customers match" : "No customers yet"} hint={q ? "Try a different name or part of the phone number." : "Customers appear here after their first order."} /> : (
        <DataTable head={["Customer", "Orders", "Delivered", "Returned", "Spent", "Last order"]}>
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-sunken/40">
              <Td><Link href={`/admin/customers/${c.id}`} className="font-semibold hover:underline">{c.name}</Link> {blocked.has(c.phone) && <Badge color="#dc2626">Blocked</Badge>}<div className="num text-xs text-muted" dir="ltr">{formatPhoneIntl(c.phone)}</div></Td>
              <Td className="num">{c.ordersCount}</Td><Td className="num text-ok">{c.deliveredCount}</Td><Td className={`num ${c.returnedCount ? "text-danger" : "text-muted"}`}>{c.returnedCount}</Td>
              <Td className="num font-semibold">{formatMoney(c.totalSpent, s.store.currency)}</Td>
              <Td className="num text-muted">{c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("en-GB") : "—"}</Td>
            </tr>
          ))}
        </DataTable>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil((total?.n ?? 0) / PER))} base="/admin/customers" params={{ q }} />
    </div>
  );
}
