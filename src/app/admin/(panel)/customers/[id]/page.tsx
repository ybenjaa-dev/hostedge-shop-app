import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { statusInfo } from "@/lib/status-labels";
import { formatMoney } from "@/lib/money";
import { formatPhoneIntl, whatsappLink } from "@/lib/phone";
import { Badge, Empty, PageHeader, Panel, Stat } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { ActionButton } from "@/features/settings/components/action-button";
import { blockPhone, unblockPhone } from "@/features/crm/actions";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const db = getDb();
  const c = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).get();
  if (!c) notFound();
  const s = await getSettings();
  const [orders, block] = await Promise.all([
    db.select().from(schema.orders).where(eq(schema.orders.phone, c.phone)).orderBy(desc(schema.orders.createdAt)).limit(100),
    db.select().from(schema.blockedPhones).where(eq(schema.blockedPhones.phone, c.phone)).get(),
  ]);
  const done = c.deliveredCount + c.returnedCount;
  const rate = done > 0 ? Math.round((c.deliveredCount / done) * 100) : null;
  return (
    <div>
      <Link href="/admin/customers" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />Customers</Link>
      <PageHeader title={c.name} sub={formatPhoneIntl(c.phone)} actions={<>
        <a href={`tel:+${c.phone}`} className="btn btn-outline btn-sm"><Phone className="size-4" aria-hidden />Call</a>
        <a href={whatsappLink(c.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><MessageCircle className="size-4" aria-hidden />WhatsApp</a>
        {block
          ? <ActionButton action={unblockPhone} fields={{ phone: c.phone }} confirm="Unblock this number?" className="btn btn-outline btn-sm">Unblock</ActionButton>
          : <ActionButton action={blockPhone} fields={{ phone: c.phone, reason: "Blocked from customer page" }} confirm="Block this number? It will no longer be able to place orders." className="btn btn-danger btn-sm">Block number</ActionButton>}
      </>} />
      {block && <p role="status" className="mb-4 rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">This number is blocked{block.reason ? `: ${block.reason}` : ""}.</p>}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Orders" value={c.ordersCount} /><Stat label="Delivered" value={c.deliveredCount} tone="ok" />
        <Stat label="Returned" value={c.returnedCount} tone={c.returnedCount ? "danger" : undefined} />
        <Stat label="Delivery rate" value={rate == null ? "—" : `${rate}%`} /><Stat label="Spent" value={formatMoney(c.totalSpent, s.store.currency)} />
      </div>
      <Panel title="Order history">
        {orders.length === 0 ? <Empty title="No orders" /> : (
          <DataTable head={["Order", "Date", "Status", "City", "Total"]}>
            {orders.map((o) => { const st = statusInfo(s, o.status, "en"); return (
              <tr key={o.id}><Td><Link href={`/admin/orders/${o.id}`} className="num font-semibold hover:underline">#{o.number}</Link></Td>
                <Td className="num text-muted">{new Date(o.createdAt).toLocaleDateString("en-GB")}</Td><Td><Badge color={st.color}>{st.label}</Badge></Td>
                <Td>{o.city}</Td><Td className="num font-semibold">{formatMoney(o.total, o.currency)}</Td></tr>
            ); })}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
