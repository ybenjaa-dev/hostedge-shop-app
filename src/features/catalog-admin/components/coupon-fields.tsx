"use client";
import { useState } from "react";
import { CalendarClock, Scissors, Truck } from "lucide-react";
import { Field } from "@/features/admin/components/fields";
import { DateField } from "@/features/admin/components/date-picker";

type Type = "percent" | "fixed" | "free_shipping";
export type CouponInitial = { code: string; type: Type; value: string; minSubtotal: string; maxUses: string; startsAt: string; endsAt: string };

const fmtDay = (s: string) => { const d = new Date(`${s}T00:00:00`); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };

/** Everything a coupon needs, with a live preview of the ticket the customer sees at checkout. */
export function CouponFields({ idp, initial, currency }: { idp: string; initial: CouponInitial; currency: string }) {
  const [v, setV] = useState(initial);
  const set = <K extends keyof CouponInitial>(k: K, val: CouponInitial[K]) => setV((x) => ({ ...x, [k]: val }));
  const off = v.type === "percent" ? `${v.value || "0"}% off` : v.type === "fixed" ? `${v.value || "0"} ${currency} off` : "Free shipping";
  const min = parseFloat(v.minSubtotal.replace(",", ".")) || 0;
  return (
    <div className="space-y-5">
      {/* live preview — the same ticket look as the checkout coupon box */}
      <div className="rounded-2xl border border-dashed border-brand/50 bg-brand-soft p-4" aria-label="Preview">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">What customers see</p>
        <div className="flex items-stretch overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          <div className="grid w-16 shrink-0 place-items-center bg-brand text-brand-ink">{v.type === "free_shipping" ? <Truck className="size-6" aria-hidden /> : <Scissors className="size-6" aria-hidden />}</div>
          <div className="min-w-0 flex-1 border-s border-dashed border-line p-3">
            <p className="display truncate text-lg font-extrabold" dir="ltr">{v.code.toUpperCase() || "YOURCODE"}</p>
            <p className="font-semibold text-brand">{off}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
              {min > 0 && <span>Orders from {min} {currency}</span>}
              {v.maxUses && <span>{v.maxUses} uses total</span>}
              {(v.startsAt || v.endsAt) && <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5" aria-hidden />{v.startsAt ? `${fmtDay(v.startsAt)} → ` : "Until "}{v.endsAt ? fmtDay(v.endsAt) : "no end"}</span>}
              {!min && !v.maxUses && !v.startsAt && !v.endsAt && <span>No conditions</span>}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" htmlFor={`${idp}-code`}><input id={`${idp}-code`} name="code" required value={v.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))} maxLength={30} dir="ltr" autoCapitalize="characters" className="field uppercase" /></Field>
        <Field label="Type" htmlFor={`${idp}-type`}>
          <select id={`${idp}-type`} name="type" value={v.type} onChange={(e) => set("type", e.target.value as Type)} className="field">
            <option value="percent">Percent off</option><option value="fixed">Fixed amount off</option><option value="free_shipping">Free shipping</option>
          </select>
        </Field>
        <Field label={v.type === "percent" ? "Percent (1–100)" : v.type === "fixed" ? `Amount (${currency})` : "Value"} htmlFor={`${idp}-val`}>
          <input id={`${idp}-val`} name="value" inputMode="decimal" value={v.type === "free_shipping" ? "" : v.value} onChange={(e) => set("value", e.target.value)} disabled={v.type === "free_shipping"} required={v.type !== "free_shipping"} placeholder={v.type === "free_shipping" ? "—" : ""} className="field num" />
        </Field>
        <Field label={`Minimum subtotal (${currency})`} htmlFor={`${idp}-min`} hint="0 = no minimum"><input id={`${idp}-min`} name="minSubtotal" inputMode="decimal" value={v.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} className="field num" /></Field>
        <Field label="Max uses" htmlFor={`${idp}-max`} hint="Empty = unlimited"><input id={`${idp}-max`} name="maxUses" type="number" min={1} value={v.maxUses} onChange={(e) => set("maxUses", e.target.value)} className="field num" /></Field>
        <div className="hidden sm:block" />
        <DateField name="startsAt" label="Starts" defaultValue={v.startsAt} placeholder="Immediately" onChange={(d) => set("startsAt", d)} />
        <DateField name="endsAt" label="Ends" defaultValue={v.endsAt} placeholder="No end date" onChange={(d) => set("endsAt", d)} min={v.startsAt || undefined} />
      </div>
    </div>
  );
}
