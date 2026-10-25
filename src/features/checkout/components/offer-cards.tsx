"use client";
import { Check, Flame, Star } from "lucide-react";
import type { Offer } from "@/lib/pricing";
import { fileUrl } from "@/lib/storage";
import { useT } from "../store-context";

/**
 * Quantity offers as selectable cards ("1 for 129 · 2 for 229 · 3 for 319"). Picking a card sets the quantity; the real
 * price after bundles comes from the pricing engine, so what is shown here is exactly what the order will charge.
 */
export function OfferCards({ offers, qty, setQty, maxQty, fmt, customQty, setCustomQty }: {
  offers: Offer[]; qty: number; setQty: (n: number) => void; maxQty: number; fmt: (n: number) => string; customQty: boolean; setCustomQty: (v: boolean) => void;
}) {
  const t = useT();
  const current = offers.find((o) => o.qty === qty);
  return (
    <fieldset className="offers" aria-describedby="offers-note">
      <legend className="label">{t("offer.title")}</legend>
      <div role="radiogroup" aria-label={t("offer.title")} className="mt-2 grid gap-2.5">
        {offers.map((o) => {
          const on = qty === o.qty && !customQty;
          const off = o.qty > maxQty;
          return (
            <label key={o.qty} className={`offer-card ${on ? "is-on" : ""} ${off ? "is-off" : ""} ${o.popular || o.best ? "is-flag" : ""}`}>
              <input type="radio" name="offer-qty" className="sr-only" checked={on} disabled={off} onChange={() => { setCustomQty(false); setQty(o.qty); }} />
              <span className="offer-radio" aria-hidden>{on && <Check className="size-3.5" strokeWidth={3.5} />}</span>
              {o.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(o.image)} alt="" loading="lazy" className="offer-thumb" />}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="offer-count">{o.qty === 1 ? t("offer.one") : t("offer.many", { n: o.qty })}</span>
                  {o.popular && <span className="offer-flag"><Star className="size-3" aria-hidden />{o.label || t("offer.popular")}</span>}
                  {!o.popular && o.best && <span className="offer-flag"><Flame className="size-3" aria-hidden />{t("offer.best")}</span>}
                  {!o.popular && !o.best && o.label && <span className="offer-flag is-plain">{o.label}</span>}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{o.qty === 1 ? t("offer.normal") : t("offer.each", { price: fmt(o.perUnit) })}</span>
              </span>
              <span className="shrink-0 text-end leading-tight">
                <span dir="ltr" className="num offer-price block">{fmt(o.total)}</span>
                {o.saved > 0 && <span dir="ltr" className="num block text-xs text-muted line-through">{fmt(o.compareAt)}</span>}
                {o.savePct > 0 && <span className="offer-save">{t("offer.save", { pct: o.savePct })}</span>}
              </span>
            </label>
          );
        })}
      </div>
      <p id="offers-note" className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted">
        <span>{current && current.saved > 0 ? <b className="text-ok">{t("offer.youSave", { amount: fmt(current.saved) })}</b> : t("offer.same")}</span>
        <button type="button" className="font-semibold underline underline-offset-2 hover:text-ink" onClick={() => setCustomQty(!customQty)}>{t("offer.other")}</button>
      </p>
    </fieldset>
  );
}
