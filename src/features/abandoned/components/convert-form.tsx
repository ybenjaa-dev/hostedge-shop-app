"use client";
import { useEffect, useId, useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, Minus, PackagePlus, Plus, Search, Ticket, Trash2, X } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { SubmitButton } from "@/components/ui/submit";
import { formatMoney } from "@/lib/money";
import { convertAbandoned, quoteConvertDraft, type ConvertQuote } from "../actions";
import type { AbandonedLine } from "../lib";

export type ProductOption = { key: string; productId: string; variantId: string | null; label: string; price: number };
type Draft = AbandonedLine & { label: string };
type Ok = Extract<ConvertQuote, { ok: true }>;

const COUPON_MSG: Record<Ok["couponStatus"], string> = {
  none: "", ok: "Coupon applied", invalid: "This code doesn't exist", expired: "This coupon has expired", min_subtotal: "Order is below the coupon's minimum", exhausted: "This coupon has reached its usage limit",
};

export function ConvertForm({ id, initial, cities, products, currency }: {
  id: string;
  initial: { name: string; phone: string; city: string; address: string; notes: string; coupon: string; lines: Draft[] };
  cities: { id: string; name: string }[]; products: ProductOption[]; currency: string;
}) {
  const uid = useId();
  const matched = cities.find((c) => c.name.toLowerCase() === initial.city.trim().toLowerCase());
  const [city, setCity] = useState(matched?.id ?? (initial.city ? "text" : ""));
  const [lines, setLines] = useState<Draft[]>(initial.lines);
  const [coupon, setCoupon] = useState(initial.coupon);
  const [ship, setShip] = useState("");

  const payload = useMemo(
    () => ({ lines: lines.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })), cityId: city && city !== "text" ? city : undefined, coupon: coupon.trim() || undefined, shippingFee: ship.trim() || undefined }),
    [lines, city, coupon, ship],
  );
  const key = JSON.stringify(payload);
  const [res, setRes] = useState<{ key: string; quote: ConvertQuote } | null>(null);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      quoteConvertDraft(payload).then(
        (quote) => live && setRes({ key, quote }),
        () => live && setRes({ key, quote: { ok: false, error: "Could not price this order." } }),
      );
    }, 350);
    return () => { live = false; clearTimeout(t); };
  }, [payload, key]);
  const quote = res?.quote ?? null;
  const busy = res?.key !== key;

  const setQty = (i: number, qty: number) => setLines((l) => l.map((x, j) => (j === i ? { ...x, qty: Math.min(99, Math.max(1, qty || 1)) } : x)));
  const add = (p: ProductOption) => setLines((l) => {
    const i = l.findIndex((x) => x.productId === p.productId && x.variantId === p.variantId);
    if (i >= 0) return l.map((x, j) => (j === i ? { ...x, qty: Math.min(99, x.qty + 1) } : x));
    return [...l, { productId: p.productId, variantId: p.variantId, name: p.label, variantName: null, label: p.label, qty: 1, unitPrice: p.price }];
  });

  const q = quote?.ok ? quote : null;
  const money = (n: number) => formatMoney(n, q?.currency ?? currency, "en");
  const problems = q?.problems ?? [];
  const canSubmit = lines.length > 0 && !busy && !!q && problems.length === 0;

  return (
    <AdminForm action={convertAbandoned} hideSubmit className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lines" value={JSON.stringify(payload.lines)} />
      <input type="hidden" name="cityId" value={payload.cityId ?? ""} />
      <input type="hidden" name="cityText" value={city === "text" ? initial.city : ""} />

      <div className="space-y-5">
        <section className="card space-y-4 p-5">
          <h2 className="text-sm font-bold">Customer & delivery</h2>
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
            <Field label="Shipping fee override" htmlFor={`${uid}-s`} hint={`Empty = city rate${q ? ` (${q.shippingFree ? "free" : money(q.shipping)})` : ""}. In ${currency}.`}>
              <input id={`${uid}-s`} name="shippingFee" value={ship} onChange={(e) => setShip(e.target.value)} inputMode="decimal" className="field" placeholder="auto" />
            </Field>
          </div>
          <Field label="Address" htmlFor={`${uid}-a`}><textarea id={`${uid}-a`} name="address" defaultValue={initial.address} required minLength={4} maxLength={300} rows={2} className="field" /></Field>
          <Field label="Internal note (optional)" htmlFor={`${uid}-o`}><input id={`${uid}-o`} name="notes" defaultValue={initial.notes} maxLength={500} className="field" /></Field>
        </section>

        <section className="card space-y-3 p-5">
          <h2 className="text-sm font-bold">Products</h2>
          <ProductPicker products={products} currency={currency} onPick={add} />
          {lines.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted"><PackagePlus className="size-6" aria-hidden />No products yet — search above to add one.</div>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line">
              {lines.map((l, i) => {
                const ql = q?.lines[i];
                return (
                  <li key={`${l.productId}-${l.variantId ?? ""}`} className="flex flex-wrap items-center gap-3 p-3">
                    {ql?.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={ql.image} alt="" className="size-12 shrink-0 rounded-lg border border-line object-cover" /> : <div className="size-12 shrink-0 rounded-lg bg-surface" aria-hidden />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{l.label}</p>
                      <p className="num text-xs text-muted">{money(ql?.unitPrice ?? l.unitPrice)} each{ql?.available != null && ql.available <= 5 ? ` · ${ql.available} in stock` : ""}</p>
                    </div>
                    <div className="flex items-center rounded-lg border border-line" role="group" aria-label={`Quantity for ${l.label}`}>
                      <button type="button" className="grid size-9 place-items-center text-muted hover:text-ink disabled:opacity-40" disabled={l.qty <= 1} onClick={() => setQty(i, l.qty - 1)} aria-label="Decrease quantity"><Minus className="size-4" aria-hidden /></button>
                      <input type="number" min={1} max={99} value={l.qty} onChange={(e) => setQty(i, Number(e.target.value))} aria-label="Quantity" className="num h-9 w-12 border-x border-line bg-transparent text-center text-sm font-semibold outline-none" />
                      <button type="button" className="grid size-9 place-items-center text-muted hover:text-ink disabled:opacity-40" disabled={l.qty >= 99} onClick={() => setQty(i, l.qty + 1)} aria-label="Increase quantity"><Plus className="size-4" aria-hidden /></button>
                    </div>
                    <p className="num w-24 text-end text-sm font-bold">{ql ? money(ql.lineTotal) : "…"}</p>
                    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Remove ${l.label}`} onClick={() => setLines((x) => x.filter((_, j) => j !== i))}><Trash2 className="size-4" aria-hidden /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <aside className="card space-y-4 p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Order summary</h2>{busy && <Loader2 className="size-4 animate-spin text-muted" aria-label="Updating prices" />}</div>
        <div>
          <label htmlFor={`${uid}-k`} className="mb-1 block text-sm font-semibold">Coupon</label>
          <div className="relative">
            <Ticket className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id={`${uid}-k`} name="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} maxLength={40} autoComplete="off" dir="ltr" placeholder="Code" className="field !ps-9 uppercase" />
          </div>
          {q && coupon.trim() && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${q.couponStatus === "ok" ? "text-success" : "text-danger"}`}>
              {q.couponStatus === "ok" ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}{COUPON_MSG[q.couponStatus]}
            </p>
          )}
        </div>
        <dl className={`num space-y-2 border-t border-line pt-4 text-sm transition-opacity ${busy ? "opacity-60" : ""}`}>
          <Row label="Subtotal" value={q ? money(q.subtotal) : "—"} />
          {q && q.discount > 0 && <Row label="Discount" value={`− ${money(q.discount)}`} tone="success" />}
          <Row label="Shipping" value={q ? (q.shippingFree ? "Free" : money(q.shipping)) : "—"} />
          {q && q.cod > 0 && <Row label="COD fee" value={money(q.cod)} />}
          <div className="flex items-baseline justify-between border-t border-line pt-3 text-base font-extrabold"><dt>Total (cash on delivery)</dt><dd>{q ? money(q.total) : "—"}</dd></div>
        </dl>
        {quote && !quote.ok && <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs font-medium text-danger"><AlertTriangle className="mt-px size-4 shrink-0" aria-hidden />{quote.error}</p>}
        {problems.map((p) => <p key={p} role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-xs font-medium text-danger"><AlertTriangle className="mt-px size-4 shrink-0" aria-hidden />{p}</p>)}
        <SubmitButton pendingText="Creating order…" className="btn btn-primary w-full" disabled={!canSubmit}>Create order</SubmitButton>
        <p className="text-center text-xs text-muted">Prices, offers, coupon and stock are checked again by the server when you create the order.</p>
      </aside>
    </AdminForm>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted">{label}</dt><dd className={tone === "success" ? "font-semibold text-success" : "font-semibold"}>{value}</dd></div>;
}

function ProductPicker({ products, currency, onPick }: { products: ProductOption[]; currency: string; onPick: (p: ProductOption) => void }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const list = useId();
  const matches = useMemo(() => {
    const t = text.trim().toLowerCase();
    return (t ? products.filter((p) => p.label.toLowerCase().includes(t)) : products).slice(0, 8);
  }, [products, text]);
  const pick = (p: ProductOption) => { onPick(p); setText(""); setOpen(false); setHi(0); };
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        value={text} role="combobox" aria-expanded={open} aria-controls={list} aria-autocomplete="list" placeholder="Search products to add…" className="field !ps-9" autoComplete="off"
        onChange={(e) => { setText(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter" && open && matches[hi]) { e.preventDefault(); pick(matches[hi]!); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul id={list} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-xl border border-line bg-bg p-1 shadow-lg">
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matching product</li>}
          {matches.map((p, i) => (
            <li key={p.key} role="option" aria-selected={i === hi} onMouseDown={(e) => { e.preventDefault(); pick(p); }} onMouseEnter={() => setHi(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${i === hi ? "bg-surface" : ""}`}>
              <span className="min-w-0 truncate">{p.label}</span><span className="num shrink-0 text-xs text-muted">{formatMoney(p.price, currency, "en")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
