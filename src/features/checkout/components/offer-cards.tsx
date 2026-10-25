"use client";
import { Check, Flame, Star } from "lucide-react";
import type { Offer } from "@/lib/pricing";
import { resolveOfferTemplate } from "@/lib/offer-templates";
import { fileUrl } from "@/lib/storage";
import { useT } from "../store-context";

/**
 * Quantity offers as selectable cards ("1 for 129 · 2 for 229 · 3 for 319") in one of several layouts (list, tiles, photo,
 * pills, highlight). Picking a card sets the quantity; the real price after bundles comes from the pricing engine, so what is
 * shown here is exactly what the order will charge.
 */
export function OfferCards({ offers, qty, setQty, maxQty, fmt, customQty, setCustomQty, template, fallbackImage }: {
  offers: Offer[]; qty: number; setQty: (n: number) => void; maxQty: number; fmt: (n: number) => string; customQty: boolean; setCustomQty: (v: boolean) => void;
  template?: string | null; fallbackImage?: string | null;
}) {
  const t = useT();
  const tpl = resolveOfferTemplate(template, null);
  const current = offers.find((o) => o.qty === qty);
  const flagged = offers.find((o) => o.popular) ?? offers.find((o) => o.best);

  const Flag = ({ o }: { o: Offer }) =>
    o.popular ? <span className="offer-flag"><Star className="size-3" aria-hidden />{o.label || t("offer.popular")}</span>
    : o.best ? <span className="offer-flag"><Flame className="size-3" aria-hidden />{t("offer.best")}</span>
    : o.label ? <span className="offer-flag is-plain">{o.label}</span> : null;
  const Save = ({ o, compact }: { o: Offer; compact?: boolean }) => (o.savePct > 0 ? <span className="offer-save">{compact ? `−${o.savePct}%` : t("offer.save", { pct: o.savePct })}</span> : null);
  const Radio = ({ on }: { on: boolean }) => <span className="offer-radio" aria-hidden>{on && <Check className="size-3.5" strokeWidth={3.5} />}</span>;
  /** Pack picture: the offer's own photo, else the product photo stacked ×N (up to 3). */
  const Visual = ({ o }: { o: Offer }) => {
    const n = Math.min(o.qty, 3);
    return (
      <span className="offer-visual" aria-hidden>
        {o.image
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(o.image, "thumb")} alt="" loading="lazy" className="size-full object-cover" />
          : fallbackImage
            ? Array.from({ length: n }).map((_, k) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={k} src={fileUrl(fallbackImage, "thumb")} alt="" loading="lazy" className="offer-stack-img" style={{ width: n === 1 ? "100%" : "68%", insetInlineStart: n === 1 ? 0 : `${(k * 32) / (n - 1)}%`, top: n === 1 ? 0 : `${((n - 1 - k) * 12) / (n - 1)}%`, zIndex: k }} />)
            : null}
        {o.qty > 1 && <span className="offer-times">×{o.qty}</span>}
      </span>
    );
  };

  const cols = Math.min(offers.length, tpl === "photo" ? 3 : 4);
  return (
    <fieldset className="offers" aria-describedby="offers-note">
      <legend className="label">{t("offer.title")}</legend>
      <div role="radiogroup" aria-label={t("offer.title")} className={`offers-grid t-${tpl} mt-2`} style={{ "--n": cols } as React.CSSProperties}>
        {offers.map((o) => {
          const on = qty === o.qty && !customQty;
          const off = o.qty > maxQty;
          const hl = tpl === "highlight" && flagged?.qty === o.qty && o.qty > 1;
          const cls = `offer-card t-${tpl} ${on ? "is-on" : ""} ${off ? "is-off" : ""} ${o.popular || o.best ? "is-flag" : ""} ${hl ? "is-hl" : ""}`;
          const input = <input type="radio" name="offer-qty" className="sr-only" checked={on} disabled={off} onChange={() => { setCustomQty(false); setQty(o.qty); }} />;
          const count = o.qty === 1 ? t("offer.one") : t("offer.many", { n: o.qty });

          if (tpl === "tiles") return (
            <label key={o.qty} className={cls}>{input}
              <Radio on={on} />
              {(o.popular || o.best || o.label) && <Flag o={o} />}
              <span className="offer-qty">{o.qty}</span>
              <span className="offer-unit">{o.qty === 1 ? t("offer.unitOne") : t("offer.unitMany", { n: o.qty })}</span>
              <span dir="ltr" className="num offer-price">{fmt(o.total)}</span>
              {o.saved > 0 ? <span dir="ltr" className="num text-xs text-muted line-through">{fmt(o.compareAt)}</span> : <span className="text-xs text-muted">{t("offer.normal")}</span>}
              <Save o={o} compact />
            </label>
          );
          if (tpl === "photo") return (
            <label key={o.qty} className={cls}>{input}
              <span className="relative block w-full"><Visual o={o} /><Radio on={on} /></span>
              {(o.popular || o.best || o.label) && <Flag o={o} />}
              <span className="offer-count">{count}</span>
              <span dir="ltr" className="num offer-price">{fmt(o.total)}</span>
              {o.saved > 0 && <span dir="ltr" className="num text-xs text-muted line-through">{fmt(o.compareAt)}</span>}
              <Save o={o} compact />
            </label>
          );
          if (tpl === "pills") return (
            <label key={o.qty} className={cls}>{input}
              {(o.popular || o.best) && <span className="offer-dot" aria-hidden><Star className="size-3" /></span>}
              <span className="offer-count">{o.qty}×</span>
              <span dir="ltr" className="num offer-price">{fmt(o.total)}</span>
              {o.savePct > 0 ? <span className="offer-save">−{o.savePct}%</span> : <span className="text-[0.7rem] text-muted">{t("offer.normal")}</span>}
            </label>
          );
          if (tpl === "highlight") return (
            <label key={o.qty} className={cls}>{input}
              <Radio on={on} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="offer-count">{count}</span><Flag o={o} /></span>
                {(hl || o.qty === 1) && <span className="mt-0.5 block text-xs opacity-75">{o.qty === 1 ? t("offer.normal") : t("offer.each", { price: fmt(o.perUnit) })}</span>}
              </span>
              <span className="shrink-0 text-end leading-tight">
                <span dir="ltr" className="num offer-price block">{fmt(o.total)}</span>
                {o.saved > 0 && <span dir="ltr" className="num block text-xs line-through opacity-70">{fmt(o.compareAt)}</span>}
                <Save o={o} compact={!hl} />
              </span>
            </label>
          );
          // list
          return (
            <label key={o.qty} className={cls}>{input}
              <Radio on={on} />
              {o.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(o.image, "thumb")} alt="" loading="lazy" className="offer-thumb" />}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="offer-count">{count}</span><Flag o={o} /></span>
                <span className="mt-0.5 block text-xs text-muted">{o.qty === 1 ? t("offer.normal") : t("offer.each", { price: fmt(o.perUnit) })}</span>
              </span>
              <span className="shrink-0 text-end leading-tight">
                <span dir="ltr" className="num offer-price block">{fmt(o.total)}</span>
                {o.saved > 0 && <span dir="ltr" className="num block text-xs text-muted line-through">{fmt(o.compareAt)}</span>}
                <Save o={o} />
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
