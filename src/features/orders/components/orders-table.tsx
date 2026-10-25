"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { MessageCircle, Phone, Printer, Download, CheckCircle2 } from "lucide-react";
import { bulkStatusAction } from "../admin-actions";
import { useToast } from "@/components/toast";
import { ORDER_STATUSES } from "@/lib/order-status";
import { formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { Badge } from "@/features/admin/components/ui";

export type Row = { id: string; number: string; status: string; name: string; phone: string; city: string; total: number; currency: string; carrierId: string | null; trackingNumber: string | null; attempts: number; createdAt: number; itemsCount: number; shipmentError: string | null };
type Carrier = { id: string; name: string };

export function OrdersTable({ rows, labels, colors, carriers, exportQs, bulkCarrier }: {
  rows: Row[]; labels: Record<string, string>; colors: Record<string, string>; carriers: Carrier[]; exportQs: string;
  bulkCarrier?: (ids: string[], carrierId: string) => Promise<{ orderId: string; ok: boolean; error?: string }[]>;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toast = useToast();
  const all = rows.length > 0 && sel.size === rows.length;
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const ids = [...sel];

  const bulk = (to: string) =>
    start(async () => {
      const r = await bulkStatusAction(ids, to);
      if (r.error) return toast("error", r.error);
      toast(r.failed.length ? "error" : "success", `${r.done} updated${r.failed.length ? `, ${r.failed.length} skipped (${r.failed[0]!.error})` : ""}`);
      setSel(new Set());
      location.reload();
    });

  const ago = (t: number) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`; };

  return (
    <div>
      {sel.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand bg-brand-soft p-3 shadow-lg" role="toolbar" aria-label="Bulk actions">
          <span className="text-sm font-bold">{sel.size} selected</span>
          <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => bulk("confirmed")}><CheckCircle2 className="size-4" />Confirm</button>
          <select aria-label="Change status" className="field !min-h-9 !w-auto !py-1 text-sm" disabled={pending} value="" onChange={(e) => e.target.value && bulk(e.target.value)}>
            <option value="">Change status…</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{labels[s]}</option>)}
          </select>
          {bulkCarrier && carriers.length > 0 && (
            <select aria-label="Send to carrier" className="field !min-h-9 !w-auto !py-1 text-sm" disabled={pending} value="" onChange={(e) => {
              const c = e.target.value; if (!c) return;
              start(async () => { const r = await bulkCarrier(ids, c); const bad = r.filter((x) => !x.ok); toast(bad.length ? "error" : "success", bad.length ? `${r.length - bad.length} sent, ${bad.length} failed: ${bad[0]!.error}` : `${r.length} sent to carrier`); location.reload(); });
            }}>
              <option value="">Send to carrier…</option>
              {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <a className="btn btn-outline btn-sm" target="_blank" href={`/admin/print?type=slip&ids=${ids.join(",")}`}><Printer className="size-4" />Packing slips</a>
          <a className="btn btn-outline btn-sm" href={`/admin/orders/export?ids=${ids.join(",")}`}><Download className="size-4" />CSV</a>
          <button className="btn btn-ghost btn-sm ms-auto" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="border-b border-line bg-sunken/60 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="w-10 p-3"><input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} className="size-4 accent-[var(--brand)]" /></th>
                <th className="p-3 text-start">Order</th><th className="p-3 text-start">Customer</th><th className="p-3 text-start">City</th><th className="p-3 text-start">Status</th><th className="p-3 text-start">Carrier</th><th className="p-3 text-end">Total</th><th className="p-3 text-end">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className={`transition hover:bg-sunken/50 ${sel.has(r.id) ? "bg-brand-soft" : ""}`}>
                  <td className="p-3"><input type="checkbox" aria-label={`Select order ${r.number}`} checked={sel.has(r.id)} onChange={() => toggle(r.id)} className="size-4 accent-[var(--brand)]" /></td>
                  <td className="p-3"><Link href={`/admin/orders/${r.id}`} className="num font-extrabold text-brand hover:underline">#{r.number}</Link><p className="text-xs text-muted">{ago(r.createdAt)} ago · {r.itemsCount} item{r.itemsCount === 1 ? "" : "s"}</p></td>
                  <td className="p-3"><p className="font-semibold">{r.name}</p><p dir="ltr" className="num text-start text-xs text-muted">+{r.phone}</p></td>
                  <td className="p-3">{r.city}</td>
                  <td className="p-3"><Badge color={colors[r.status]}>{labels[r.status] ?? r.status}</Badge>{r.status === "no_answer" && <span className="ms-1.5 text-xs font-bold text-muted">×{r.attempts}</span>}{r.shipmentError && <p className="mt-1 max-w-48 truncate text-xs text-danger" title={r.shipmentError}>⚠ {r.shipmentError}</p>}</td>
                  <td className="p-3 text-xs">{r.carrierId ? <><span className="font-semibold capitalize">{r.carrierId}</span>{r.trackingNumber && <p dir="ltr" className="num text-muted">{r.trackingNumber}</p>}</> : <span className="text-muted">—</span>}</td>
                  <td dir="ltr" className="num p-3 text-end font-bold">{formatMoney(r.total, r.currency, "en")}</td>
                  <td className="p-3"><div className="flex justify-end gap-1">
                    <a href={`tel:+${r.phone}`} aria-label={`Call ${r.name}`} className="btn btn-ghost btn-sm !px-2"><Phone className="size-4" /></a>
                    <a href={whatsappLink(r.phone)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${r.name}`} className="btn btn-ghost btn-sm !px-2 text-[#128c7e]"><MessageCircle className="size-4" /></a>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <a href={`/admin/orders/export?${exportQs}`} className="btn btn-outline btn-sm mt-3"><Download className="size-4" />Export filtered CSV</a>
    </div>
  );
}
