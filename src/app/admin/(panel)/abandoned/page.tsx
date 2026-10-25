import { desc, eq, sql } from "drizzle-orm";
import { MessageCircle, Check } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { normalizePhone, whatsappLink, formatPhoneIntl } from "@/lib/phone";
import { tr } from "@/lib/i18n-core";
import { Empty, PageHeader, Pager } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { ActionButton } from "@/features/settings/components/action-button";
import { fillTemplate } from "@/features/crm/template";
import { markAbandonedDone } from "@/features/crm/actions";
import { pageNum } from "@/features/settings/lib";

export const metadata = { title: "Abandoned orders" };
const PER = 30;

function ago(ms: number) {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}

export default async function AbandonedPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const page = pageNum((await searchParams).page);
  const s = await getSettings();
  const db = getDb();
  const where = eq(schema.abandonedOrders.recovered, false);
  const [rows, total] = await Promise.all([
    db.select().from(schema.abandonedOrders).where(where).orderBy(desc(schema.abandonedOrders.updatedAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)` }).from(schema.abandonedOrders).where(where).get(),
  ]);
  const lang = s.store.defaultLang;
  const tpl = tr(s.templates.followup, lang);
  return (
    <div>
      <PageHeader title="Abandoned orders" sub="Visitors who typed their phone but did not finish ordering. Follow up on WhatsApp." />
      {rows.length === 0 ? <Empty title="Nothing to follow up" hint="Abandoned checkouts with a phone number appear here." /> : (
        <DataTable head={["Customer", "Product", "City", "When", ""]}>
          {rows.map((r) => {
            const n = r.phone ? normalizePhone(r.phone, s.store.country) : null;
            const e164 = n?.ok ? n.e164 : r.phone && /^\d{8,15}$/.test(r.phone) ? r.phone : null;
            const msg = fillTemplate(tpl, { name: r.name ?? "", store: s.store.name });
            return (
              <tr key={r.id}>
                <Td><div className="font-semibold">{r.name || "—"}</div><div className="num text-xs text-muted" dir="ltr">{e164 ? formatPhoneIntl(e164) : r.phone || "no phone"}</div></Td>
                <Td>{r.productName || "—"}</Td><Td>{r.city || "—"}</Td><Td className="whitespace-nowrap text-muted">{ago(r.updatedAt)}</Td>
                <Td><div className="flex justify-end gap-2">
                  {e164 ? <a href={whatsappLink(e164, msg)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm"><MessageCircle className="size-4" aria-hidden />WhatsApp follow-up</a>
                    : <span className="btn btn-outline btn-sm" aria-disabled="true">No valid phone</span>}
                  <ActionButton action={markAbandonedDone} fields={{ id: r.id }}><Check className="size-4" aria-hidden />Done</ActionButton>
                </div></Td>
              </tr>
            );
          })}
        </DataTable>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil((total?.n ?? 0) / PER))} base="/admin/abandoned" params={{}} />
    </div>
  );
}
