"use client";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { OFFER_TEMPLATES, type OfferTemplate } from "@/lib/offer-templates";
import { OfferCards } from "@/features/checkout/components/offer-cards";
import { StoreProvider, type ClientStore } from "@/features/checkout/store-context";
import { offersFor, type BundleRule } from "@/lib/pricing";
import { BRAND } from "@/lib/brand";
import { DICT } from "@/lib/dict";
import { dirOf } from "@/lib/i18n-core";

const noop = () => {};

/** The real offer cards (the same component and theme as the shop) with sample prices, so the choice is what customers will actually see. */
function RealPreview({ id, currency, lang, image }: { id: OfferTemplate; currency: string; lang: string; image?: string | null }) {
  const store = useMemo(() => ({ lang, currency, codMode: true, placement: "inline", codFee: 0, defaultShippingFee: 0, freeThreshold: 0, taxRateBp: 0, taxInclusive: true, country: "MA", countries: ["MA"], whatsapp: "", bundlesInForm: false, dict: DICT[lang] ?? DICT.en }) as unknown as ClientStore, [lang, currency]);
  const cards = useMemo(() => {
    const rules: BundleRule[] = [
      { productId: "demo", minQty: 2, percent: 0, price: 22900, label: null, popular: true, image: null } as unknown as BundleRule,
      { productId: "demo", minQty: 3, percent: 0, price: 31900, label: null, popular: false, image: null } as unknown as BundleRule,
    ];
    return offersFor("demo", 12900, rules);
  }, []);
  const fmt = (n: number) => `${(n / 100).toFixed(0)} ${currency}`;
  return (
    <StoreProvider value={store}>
      <div aria-hidden inert className={`${BRAND.themeClass} pointer-events-none select-none rounded-xl bg-bg p-3`} dir={dirOf(lang)}>
        <OfferCards offers={cards} qty={2} setQty={noop} maxQty={99} fmt={fmt} customQty={false} setCustomQty={noop} template={id} fallbackImage={image} />
      </div>
    </StoreProvider>
  );
}

/** Radio cards for the offer-card layout, each showing the real design. `allowDefault` adds "Use the store default" (per-product override). Submits `name`. */
export function OfferTemplatePicker({ name, value, allowDefault, defaultLabel, onChange, currency = "MAD", lang = "en", image }: { name: string; value: string; allowDefault?: boolean; defaultLabel?: string; onChange?: (v: string) => void; currency?: string; lang?: string; image?: string | null }) {
  const [v, setV] = useState(value);
  const items: { id: OfferTemplate | ""; name: string; hint: string }[] = [
    ...(allowDefault ? [{ id: "" as const, name: "Store default", hint: defaultLabel ? `Currently “${defaultLabel}”. Change it under Coupons & bundles.` : "Follows the store-wide choice." }] : []),
    ...OFFER_TEMPLATES,
  ];
  return (
    <fieldset>
      <legend className="sr-only">Offer card layout</legend>
      <input type="hidden" name={name} value={v} />
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => {
          const on = v === it.id;
          return (
            <label key={it.id || "default"} className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border-2 p-3.5 transition focus-within:outline focus-within:outline-2 focus-within:outline-brand ${on ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-ink/30"}`}>
              <input type="radio" className="sr-only" name={`${name}-ui`} checked={on} onChange={() => { setV(it.id); onChange?.(it.id); }} />
              <div className="flex-1">
                {it.id ? <RealPreview id={it.id} currency={currency} lang={lang} image={image} />
                  : <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-line bg-sunken/60 p-4 text-center text-sm font-semibold text-muted">Uses the layout chosen for the whole store</div>}
              </div>
              <div>
                <span className="flex items-center justify-between gap-2 text-sm font-extrabold">{it.name}{on && <span className="grid size-6 place-items-center rounded-full bg-brand text-brand-ink"><Check className="size-3.5" strokeWidth={3.5} aria-hidden /></span>}</span>
                <span className="mt-1 block text-xs leading-snug text-muted">{it.hint}</span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
