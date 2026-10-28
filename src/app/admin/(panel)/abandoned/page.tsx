import Link from "next/link";
import { Download, Phone, FilePlus2, Undo2, Ban, Eye } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { formatPhoneIntl } from "@/lib/phone";
import { whatsappLink } from "@/lib/phone";
import { formatMoney } from "@/lib/money";
import { Badge, Empty, FbItem, FilterBar, PageHeader, Pager } from "@/features/admin/components/ui";
import { DateRangeField } from "@/features/admin/components/date-picker";
import { DataTable, Td } from "@/features/settings/components/table";
import { ActionButton } from "@/features/settings/components/action-button";
import { ContactButton } from "@/features/abandoned/components/contact-button";
import { dismissAbandoned, restoreAbandoned } from "@/features/abandoned/actions";
import { listAbandoned, PER_PAGE } from "@/features/abandoned/queries";
import { ABANDONED_STATUSES, STATUS_META, linesSubtotal, parseLines } from "@/features/abandoned/lib";
import { ago, followupMessage, rowE164, rowProducts, rowStatus } from "@/features/abandoned/view";

export const metadata = { title: "Abandoned orders" };
type SP = Record<string, string | undefined>;

export default async function AbandonedPage({ searchParams }: { searchParams: Promise<SP> }) {
  const me = await requirePerm("abandoned.view");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const s = await getSettings();
  const { rows, total, counts, cities } = await listAbandoned(sp, page);
  const mayConvert = can(me.role, "orders.confirm");
  const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && k !== "page") as [string, string][]);
  const all = ABANDONED_STATUSES.reduce((a, k) => a + (counts[k] ?? 0), 0);
  const tab = (key: string, label: string, n: number) => {
    const u = new URLSearchParams(qs);
    u.delete("status");
    if (key) u.set("status", key);
    return (
      <Link key={key} href={`?${u}`} aria-current={(sp.status ?? "") === key ? "page" : undefined}
        className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${(sp.status ?? "") === key ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-ink/80 hover:bg-sunken"}`}>
        {label}<span className="num ms-1.5 opacity-70">{n}</span>
      </Link>
    );
  };
  return (
    <div>
      <PageHeader title="Abandoned orders" sub="Checkouts where the visitor typed a phone number but did not order. Nothing is ever deleted: follow up, convert, or dismiss." />
      <nav className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Status">
        {tab("", "All", all)}
        {ABANDONED_STATUSES.map((k) => tab(k, STATUS_META[k].label, counts[k] ?? 0))}
      </nav>
      <FilterBar hidden={{ status: sp.status }} actions={<>
        <button className="btn btn-primary">Filter</button>
        <a href={`/admin/abandoned/export?${qs}`} className="btn btn-outline" download title="Download every row matching these filters">
          <Download className="size-4" aria-hidden />Export CSV
        </a>
      </>}>
        <FbItem grow><input name="q" defaultValue={sp.q} placeholder="Search name, phone, product…" aria-label="Search" className="field" /></FbItem>
        <FbItem><select name="city" defaultValue={sp.city ?? ""} aria-label="City" className="field"><option value="">All cities</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select></FbItem>
        <FbItem wide><DateRangeField from={sp.from} to={sp.to} /></FbItem>
      </FilterBar>
      {rows.length === 0 ? (
        <Empty title={all === 0 ? "No abandoned checkouts yet" : "No checkouts match these filters"} hint={all === 0 ? "When a visitor types a valid phone number on the order form, the checkout appears here." : undefined}
          action={all === 0 ? undefined : <Link href="/admin/abandoned" className="btn btn-outline btn-sm">Clear filters</Link>} />
      ) : (
        <DataTable head={["Customer", "Products", "City", "Total", "Status", "When", { label: "Actions", end: true }]} minWidth="56rem" caption="Abandoned checkouts">
          {rows.map((r) => {
            const e164 = rowE164(r, s.store.country);
            const st = rowStatus(r);
            const lines = parseLines(r.lines);
            const total = r.total ?? (lines.length ? linesSubtotal(lines) : null);
            return (
              <tr key={r.id}>
                <Td><Link href={`/admin/abandoned/${r.id}`} className="font-semibold hover:underline">{r.name || "—"}</Link><div className="num text-xs text-muted" dir="ltr">{e164 ? formatPhoneIntl(e164) : r.phone || "no phone"}</div></Td>
                <Td className="max-w-[16rem]"><span className="line-clamp-2">{rowProducts(r) || "—"}</span></Td>
                <Td>{r.city || "—"}</Td>
                <Td className="num whitespace-nowrap">{total ? formatMoney(total, r.currency || s.store.currency, "en") : "—"}</Td>
                <Td><Badge color={STATUS_META[st].color}>{STATUS_META[st].label}</Badge>{r.contactedCount > 0 && <div className="mt-1 text-xs text-muted">{r.contactedCount}× contacted</div>}</Td>
                <Td className="whitespace-nowrap text-muted">{ago(r.updatedAt)}</Td>
                <Td end><div className="flex flex-wrap justify-end gap-2">
                  {e164 ? <ContactButton id={r.id} href={whatsappLink(e164, followupMessage(r, s))} /> : <span className="btn btn-outline btn-sm" aria-disabled="true">No valid phone</span>}
                  {e164 && <a href={`tel:+${e164}`} className="btn btn-outline btn-sm" aria-label={`Call ${r.name ?? "customer"}`}><Phone className="size-4" aria-hidden />Call</a>}
                  {mayConvert && st !== "converted" && <Link href={`/admin/abandoned/${r.id}/convert`} className="btn btn-outline btn-sm"><FilePlus2 className="size-4" aria-hidden />Convert</Link>}
                  {st === "dismissed" ? <ActionButton action={restoreAbandoned} fields={{ id: r.id }}><Undo2 className="size-4" aria-hidden />Restore</ActionButton>
                    : st !== "converted" && <ActionButton action={dismissAbandoned} fields={{ id: r.id }}><Ban className="size-4" aria-hidden />Dismiss</ActionButton>}
                  <Link href={`/admin/abandoned/${r.id}`} className="btn btn-ghost btn-sm"><Eye className="size-4" aria-hidden />Details</Link>
                </div></Td>
              </tr>
            );
          })}
        </DataTable>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil(total / PER_PAGE))} base="/admin/abandoned" params={sp} />
    </div>
  );
}
