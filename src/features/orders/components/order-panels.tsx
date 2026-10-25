"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Truck, Download, Send, Ban, ShieldCheck } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { addNoteAction, updateStatusAction, editOrderAction, setCarrierFeeAction, blockPhoneAction, unblockPhoneAction } from "../admin-actions";
import { sendOneAction, manualTrackingAction } from "../carrier-bridge";
import { useToast } from "@/components/toast";

export function StatusPanel({ id, allowed, labels, current }: { id: string; allowed: string[]; labels: Record<string, string>; current: string }) {
  const [to, setTo] = useState(allowed[0] ?? "");
  const router = useRouter();
  if (!allowed.length) return <p className="text-sm text-muted">No further transitions from “{labels[current]}”.</p>;
  return (
    <AdminForm action={updateStatusAction} submitLabel="Update status" onDone={(s) => s?.ok && router.refresh()}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="New status">
        {allowed.map((s) => (
          <label key={s} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${to === s ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:bg-sunken"}`}>
            <input type="radio" name="status" value={s} checked={to === s} onChange={() => setTo(s)} className="sr-only" />{labels[s]}
          </label>
        ))}
      </div>
      {to === "postponed" && <Field label="Postpone until" htmlFor="pp"><input id="pp" type="datetime-local" name="postponeUntil" required className="field" /></Field>}
      <Field label="Note (optional)" htmlFor="sn"><input id="sn" name="note" className="field" maxLength={500} placeholder={to === "no_answer" ? "e.g. phone off, will retry" : ""} /></Field>
    </AdminForm>
  );
}

export function NoteForm({ id }: { id: string }) {
  const router = useRouter();
  return (
    <AdminForm action={addNoteAction} submitLabel="Add note" resetOnSuccess onDone={(s) => s?.ok && router.refresh()}>
      <input type="hidden" name="id" value={id} />
      <textarea name="body" required rows={2} maxLength={1000} className="field" placeholder="Internal note (not visible to the customer)" aria-label="Internal note" />
    </AdminForm>
  );
}

export function EditOrderForm({ o }: { o: { id: string; name: string; address: string; city: string; notes: string } }) {
  const router = useRouter();
  return (
    <AdminForm action={editOrderAction} submitLabel="Save changes" onDone={(s) => s?.ok && router.refresh()}>
      <input type="hidden" name="id" value={o.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor="eo-n"><input id="eo-n" name="name" defaultValue={o.name} required className="field" /></Field>
        <Field label="City" htmlFor="eo-c"><input id="eo-c" name="city" defaultValue={o.city} required className="field" /></Field>
      </div>
      <Field label="Address" htmlFor="eo-a"><textarea id="eo-a" name="address" defaultValue={o.address} required rows={2} className="field" /></Field>
      <Field label="Customer notes" htmlFor="eo-no"><input id="eo-no" name="notes" defaultValue={o.notes} className="field" /></Field>
    </AdminForm>
  );
}

export function CarrierPanel({ orderId, status, carrierId, tracking, error, carriers, defaultCarrier, feeMajor }: {
  orderId: string; status: string; carrierId: string | null; tracking: string | null; error: string | null; carriers: { id: string; name: string; hasApi: boolean }[]; defaultCarrier: string | null; feeMajor: string;
}) {
  const [c, setC] = useState(carrierId ?? defaultCarrier ?? carriers[0]?.id ?? "");
  const [manual, setManual] = useState(tracking ?? "");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const cur = carriers.find((x) => x.id === c);
  const canSend = ["confirmed", "ready_to_ship"].includes(status) && !tracking;
  if (!carriers.length) return <p className="text-sm text-muted">No carrier enabled yet. Enable one under <a className="font-semibold text-brand underline" href="/admin/shipping">Shipping</a>.</p>;
  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">Carrier error: {error}. The order is safe — fix the issue and retry.</p>}
      <Field label="Carrier" htmlFor="car"><select id="car" className="field" value={c} onChange={(e) => setC(e.target.value)}>{carriers.map((x) => <option key={x.id} value={x.id}>{x.name}{x.hasApi ? "" : " (export)"}</option>)}</select></Field>
      <div className="flex flex-wrap gap-2">
        {cur?.hasApi && (
          <button className="btn btn-primary btn-sm" disabled={pending || !canSend} onClick={() => start(async () => { const r = await sendOneAction(orderId, c); toast(r.ok ? "success" : "error", r.ok ? `Sent. Tracking ${r.tracking}` : r.error ?? "Failed"); router.refresh(); })}>
            {pending ? <span className="spinner" /> : <Send className="size-4" />}Send to {cur.name}
          </button>
        )}
        <a className="btn btn-outline btn-sm" href={`/admin/orders/carrier-export?carrier=${c}&ids=${orderId}`}><Download className="size-4" />CSV for {cur?.name}</a>
      </div>
      {!canSend && !tracking && <p className="text-xs text-muted">Confirm the order first (status “Confirmed” or “Ready to ship”) to send it to a carrier.</p>}
      <div className="flex gap-2">
        <input aria-label="Tracking number" className="field" value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Tracking number (manual)" dir="ltr" />
        <button className="btn btn-outline btn-sm" disabled={pending || manual.trim().length < 3} onClick={() => start(async () => { const r = await manualTrackingAction(orderId, c, manual); toast(r.ok ? "success" : "error", r.ok ? "Tracking saved" : r.error ?? "Failed"); router.refresh(); })}><Truck className="size-4" />Save</button>
      </div>
      <AdminForm action={setCarrierFeeAction} submitLabel="Save fee" onDone={(s) => s?.ok && router.refresh()} className="flex items-end gap-2">
        <input type="hidden" name="id" value={orderId} />
        <Field label="Carrier fee" htmlFor="cf"><input id="cf" name="fee" defaultValue={feeMajor} inputMode="decimal" className="field !w-32" /></Field>
      </AdminForm>
    </div>
  );
}

export function BlockPhone({ phone, blocked }: { phone: string; blocked: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button className={`btn btn-sm ${blocked ? "btn-outline" : "btn-ghost text-danger"}`} disabled={pending} onClick={() => start(async () => {
      const r = blocked ? await unblockPhoneAction(phone) : await blockPhoneAction(phone, "Blocked from order");
      toast(r?.ok ? "success" : "error", r?.ok ? (blocked ? "Phone unblocked" : "Phone blocked") : r?.error ?? "Failed");
      router.refresh();
    })}>{blocked ? <><ShieldCheck className="size-4" />Unblock phone</> : <><Ban className="size-4" />Block phone</>}</button>
  );
}
