"use client";
import { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { formatMoney } from "@/lib/money";
import { convertAbandoned } from "../actions";
import type { AbandonedLine } from "../lib";

export type ProductOption = { key: string; productId: string; variantId: string | null; label: string; price: number };
type Draft = AbandonedLine & { label: string };

export function ConvertForm({ id, initial, cities, products, currency }: {
  id: string;
  initial: { name: string; phone: string; city: string; address: string; notes: string; coupon: string; lines: Draft[] };
  cities: { id: string; name: string }[]; products: ProductOption[]; currency: string;
}) {
  const uid = useId();
  const matched = cities.find((c) => c.name.toLowerCase() === initial.city.trim().toLowerCase());
  const [city, setCity] = useState(matched?.id ?? (initial.city ? "text" : ""));
  const cityText = initial.city;
  const [lines, setLines] = useState<Draft[]>(initial.lines);
  const [pick, setPick] = useState("");
  const setQty = (i: number, qty: number) => setLines((l) => l.map((x, j) => (j === i ? { ...x, qty: Math.min(99, Math.max(1, qty || 1)) } : x)));
  const add = () => {
    const p = products.find((x) => x.key === pick);
    if (!p) return;
    setLines((l) => {
      const i = l.findIndex((x) => x.productId === p.productId && x.variantId === p.variantId);
      if (i >= 0) return l.map((x, j) => (j === i ? { ...x, qty: Math.min(99, x.qty + 1) } : x));
      return [...l, { productId: p.productId, variantId: p.variantId, name: p.label, variantName: null, label: p.label, qty: 1, unitPrice: p.price }];
    });
    setPick("");
  };
  const estimate = lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  return (
    <AdminForm action={convertAbandoned} submitLabel="Create order" className="space-y-5">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lines" value={JSON.stringify(lines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })))} />
      <input type="hidden" name="cityId" value={city && city !== "text" ? city : ""} />
      <input type="hidden" name="cityText" value={city === "text" ? cityText : ""} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" htmlFor={`${uid}-n`}><input id={`${uid}-n`} name="name" defaultValue={initial.name} required minLength={2} maxLength={80} className="field" autoComplete="off" /></Field>
        <Field label="Phone" htmlFor={`${uid}-p`} hint="With country code, e.g. +212612345678"><input id={`${uid}-p`} name="phone" defaultValue={initial.phone} required inputMode="tel" dir="ltr" className="field" /></Field>
        <Field label="City" htmlFor={`${uid}-c`}>
          <select id={`${uid}-c`} value={city} onChange={(e) => setCity(e.target.value)} required className="field">
            <option value="">Choose a city…</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            {!matched && initial.city && <option value="text">{initial.city} (not in your city list)</option>}
          </select>
        </Field>
        <Field label="Shipping fee (optional)" htmlFor={`${uid}-s`} hint={`Leave empty to use the city rate. In ${currency}.`}><input id={`${uid}-s`} name="shippingFee" inputMode="decimal" className="field" placeholder="auto" /></Field>
      </div>
      <Field label="Address" htmlFor={`${uid}-a`}><textarea id={`${uid}-a`} name="address" defaultValue={initial.address} required minLength={4} maxLength={300} rows={2} className="field" /></Field>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-bold">Products</legend>
        {lines.length === 0 && <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted">No products yet — add one below.</p>}
        {lines.map((l, i) => (
          <div key={`${l.productId}-${l.variantId ?? ""}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{l.label}</p><p className="num text-xs text-muted">{formatMoney(l.unitPrice, currency, "en")} each</p></div>
            <input type="number" min={1} max={99} value={l.qty} onChange={(e) => setQty(i, Number(e.target.value))} aria-label={`Quantity for ${l.label}`} className="field num !w-20 text-center" />
            <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${l.label}`} onClick={() => setLines((x) => x.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Add a product" className="field min-w-0 flex-1">
            <option value="">Add another product…</option>
            {products.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <button type="button" className="btn btn-outline btn-sm" disabled={!pick} onClick={add}><Plus className="size-4" aria-hidden />Add</button>
        </div>
        <p className="text-xs text-muted">Items total (estimate): <span className="num font-semibold text-ink">{formatMoney(estimate, currency, "en")}</span>. Final prices, bundle offers, coupon, shipping and stock are checked by the server.</p>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Coupon (optional)" htmlFor={`${uid}-k`}><input id={`${uid}-k`} name="coupon" defaultValue={initial.coupon} maxLength={40} className="field" autoComplete="off" /></Field>
        <Field label="Internal note (optional)" htmlFor={`${uid}-o`}><input id={`${uid}-o`} name="notes" defaultValue={initial.notes} maxLength={500} className="field" /></Field>
      </div>
    </AdminForm>
  );
}
