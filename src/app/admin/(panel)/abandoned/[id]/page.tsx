import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, FilePlus2, Phone, Undo2 } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";
import { countryByCode, formatPhoneIntl, whatsappLink } from "@/lib/phone";
import { formatMoney } from "@/lib/money";
import { Badge, Panel, PageHeader } from "@/features/admin/components/ui";
import { ActionButton } from "@/features/settings/components/action-button";
import { ContactButton } from "@/features/abandoned/components/contact-button";
import { NoteForm } from "@/features/abandoned/components/note-form";
import { dismissAbandoned, restoreAbandoned } from "@/features/abandoned/actions";
import { getAbandoned } from "@/features/abandoned/queries";
import { STATUS_META, lineLabel, linesSubtotal } from "@/features/abandoned/lib";
import { ago, followupMessage, rowE164, rowLines, rowStatus } from "@/features/abandoned/view";

export const metadata = { title: "Abandoned checkout" };

const when = (ms: number | null) => (ms ? new Date(ms).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");
const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-line py-2 text-sm last:border-0"><dt className="text-muted">{k}</dt><dd className="min-w-0 break-words text-end font-medium">{children}</dd></div>
);

export default async function AbandonedDetail({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePerm("abandoned.view");
  const { id } = await params;
  const r = await getAbandoned(id);
  if (!r) notFound();
  const s = await getSettings();
  const st = rowStatus(r);
  const e164 = rowE164(r, s.store.country);
  const cur = r.currency || s.store.currency;
  const lines = rowLines(r);
  const subtotal = r.subtotal ?? (lines.some((l) => l.unitPrice) ? linesSubtotal(lines) : null);
  const country = (() => { try { return (JSON.parse(r.extra ?? "{}") as { country?: string }).country; } catch { return undefined; } })();
  const extra = (() => { try { return JSON.parse(r.extra ?? "{}") as { url?: string; referrer?: string; utm?: Record<string, string>; customerNotes?: string }; } catch { return {}; } })();
  const mayConvert = can(me.role, "orders.confirm") && st !== "converted";
  return (
    <div>
      <Link href="/admin/abandoned" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden />All abandoned checkouts</Link>
      <PageHeader title={r.name || "Unnamed visitor"} sub={`Abandoned checkout · last activity ${ago(r.lastSeenAt ?? r.updatedAt)}`}
        actions={<>
          <Badge color={STATUS_META[st].color}>{STATUS_META[st].label}</Badge>
          {mayConvert && <Link href={`/admin/abandoned/${r.id}/convert`} className="btn btn-primary"><FilePlus2 className="size-4" aria-hidden />Convert to order</Link>}
        </>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Panel title="Customer">
            <dl>
              <Row k="Name">{r.name || "—"}</Row>
              <Row k="Phone"><span className="num" dir="ltr">{e164 ? formatPhoneIntl(e164) : r.phone || "—"}</span></Row>
              <Row k="Country">{country ? `${countryByCode(country)?.name.en ?? country}` : "—"}</Row>
              <Row k="City">{r.city || "—"}</Row>
              <Row k="Address">{r.address || "—"}</Row>
              {extra.customerNotes && <Row k="Customer note">{extra.customerNotes}</Row>}
            </dl>
          </Panel>
          <Panel title="Cart">
            {lines.length === 0 ? <p className="text-sm text-muted">No product captured.</p> : (
              <ul className="divide-y divide-line">
                {lines.map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0"><span className="num font-semibold">{l.qty}×</span> {lineLabel(l) || "Product"}</span>
                    <span className="num whitespace-nowrap text-muted">{l.unitPrice ? formatMoney(l.unitPrice * l.qty, cur, "en") : "—"}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-3 border-t border-line pt-2">
              <Row k="Subtotal">{subtotal != null ? formatMoney(subtotal, cur, "en") : "—"}</Row>
              <Row k="Total at checkout">{r.total != null ? formatMoney(r.total, cur, "en") : "—"}</Row>
              <Row k="Coupon">{r.coupon || "—"}</Row>
            </dl>
          </Panel>
          <Panel title="Where they came from">
            <dl>
              <Row k="Source">{r.source || "—"}</Row>
              <Row k="Device">{r.device || "—"}</Row>
              <Row k="Language">{r.lang || "—"}</Row>
              <Row k="Page">{extra.url ? <a href={extra.url} target="_blank" rel="noopener noreferrer" className="break-all underline">{extra.url}</a> : "—"}</Row>
              <Row k="Referrer"><span className="break-all">{extra.referrer || "—"}</span></Row>
              {extra.utm && Object.entries(extra.utm).map(([k, v]) => <Row key={k} k={k}>{v}</Row>)}
            </dl>
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Follow up">
            <div className="flex flex-wrap gap-2">
              {e164 ? <ContactButton id={r.id} href={whatsappLink(e164, followupMessage(r, s))} label="WhatsApp follow-up" /> : <p className="text-sm text-muted">No valid phone number.</p>}
              {e164 && <a href={`tel:+${e164}`} className="btn btn-outline btn-sm"><Phone className="size-4" aria-hidden />Call</a>}
              {st === "dismissed" ? <ActionButton action={restoreAbandoned} fields={{ id: r.id }}><Undo2 className="size-4" aria-hidden />Restore</ActionButton>
                : st !== "converted" && <ActionButton action={dismissAbandoned} fields={{ id: r.id }}><Ban className="size-4" aria-hidden />Dismiss</ActionButton>}
            </div>
            <p className="mt-3 whitespace-pre-line rounded-lg bg-sunken p-3 text-xs text-muted">{followupMessage(r, s)}</p>
          </Panel>
          <Panel title="Timeline">
            <dl>
              <Row k="First seen">{when(r.createdAt)}</Row>
              <Row k="Last seen">{when(r.lastSeenAt ?? r.updatedAt)}</Row>
              <Row k="Times saved">{r.saves}</Row>
              <Row k="Contacted">{r.contactedCount ? `${r.contactedCount}× · last ${when(r.contactedAt)}` : "Not yet"}</Row>
              <Row k="Converted order">{r.convertedOrderId ? <Link href={`/admin/orders/${r.convertedOrderId}`} className="font-semibold underline">Open order</Link> : "—"}</Row>
            </dl>
          </Panel>
          <Panel title="Internal note"><NoteForm id={r.id} note={r.note ?? ""} /></Panel>
        </div>
      </div>
    </div>
  );
}
