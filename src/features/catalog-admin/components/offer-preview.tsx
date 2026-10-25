"use client";
import { useMemo, useState } from "react";
import { OfferCards } from "@/features/checkout/components/offer-cards";
import { StoreProvider, type ClientStore } from "@/features/checkout/store-context";
import { offersFor, type BundleRule } from "@/lib/pricing";
import { BRAND } from "@/lib/brand";
import type { Lang } from "@/lib/i18n-core";

type Row = { qty: number; price: string; label: string; popular: boolean; image: string };
const num = (s: string) => parseFloat(String(s).replace(",", ".")) || 0;

/** The real offer cards (same component, same theme class as the shop) fed with what is typed in the form. */
export function OfferPreview({ offers, base, currency, template, image }: { offers: Row[]; base: number; currency: string; template: string; image?: string | null }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState(false);
  const store = useMemo(() => ({ lang, currency, codMode: true, placement: "inline", codFee: 0, defaultShippingFee: 0, freeThreshold: 0, taxRateBp: 0, taxInclusive: true, country: "MA", countries: ["MA"], whatsapp: "", bundlesInForm: false, dict: {} }) as unknown as ClientStore, [lang, currency]);
  const unit = Math.round(base * 100);
  const rules: BundleRule[] = useMemo(() => offers.filter((o) => o.qty >= 2 && num(o.price) > 0).map((o) => ({ productId: "preview", minQty: o.qty, percent: 0, price: Math.round(num(o.price) * 100), label: o.label || null, popular: o.popular, image: o.image || null })), [offers]);
  const cards = useMemo(() => offersFor("preview", unit, rules), [unit, rules]);
  const fmt = (n: number) => `${(n / 100).toFixed(2)} ${currency}`;
  if (!unit) return <p className="rounded-xl bg-sunken p-4 text-sm text-muted">Enter the product price to preview the offer cards.</p>;
  if (cards.length < 2) return <p className="rounded-xl bg-sunken p-4 text-sm text-muted">Add an offer (for example 2 units for a lower total) to see the cards.</p>;
  return (
    <div className="rounded-2xl border border-dashed border-line bg-sunken/50 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Preview — as customers see it</p>
        <div className="inline-flex gap-0.5 rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Preview language">
          {(["fr", "ar", "en"] as Lang[]).map((l) => <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase ${lang === l ? "bg-brand text-brand-ink" : "text-muted"}`}>{l}</button>)}
        </div>
      </div>
      <StoreProvider value={store}>
        <div className={`${BRAND.themeClass} mx-auto max-w-md rounded-2xl bg-bg p-4`} dir={lang === "ar" ? "rtl" : "ltr"}>
          <OfferCards offers={cards} qty={qty} setQty={setQty} maxQty={99} fmt={fmt} customQty={custom} setCustomQty={setCustom} template={template} fallbackImage={image} />
        </div>
      </StoreProvider>
    </div>
  );
}
