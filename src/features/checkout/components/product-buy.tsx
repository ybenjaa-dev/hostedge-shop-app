"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, X, Zap } from "lucide-react";
import type { ProductDetail } from "@/features/catalog/queries";
import type { BundleRule } from "@/lib/pricing";
import { bestBundlePercent, bundleLineTotal, offersFor } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import { useStore, useT, type CityOpt } from "../store-context";
import { OrderForm } from "./order-form";
import { OfferCards } from "./offer-cards";
import { cart, setDrawer } from "../cart-store";
import { useToast } from "@/components/toast";
import { track } from "@/lib/track";

type Variant = ProductDetail["variants"][number];
type P = Pick<ProductDetail, "id" | "slug" | "name" | "price" | "compareAt" | "stock" | "trackStock" | "variants"> & { image: string | null };

export function ProductBuy({ product, bundles, cities, autoOpen }: { product: P; bundles: BundleRule[]; cities: CityOpt[]; autoOpen: boolean }) {
  const st = useStore();
  const t = useT();
  const toast = useToast();
  const fmt = (n: number) => formatMoney(n, st.currency, st.lang);
  const hasVariants = product.variants.length > 0;

  // option groups, e.g. { Size: ["S","M"], Color: ["Red"] }
  const groups = useMemo(() => {
    const g: Record<string, string[]> = {};
    for (const v of product.variants) for (const [k, val] of Object.entries(v.options)) if (!g[k]?.includes(val)) (g[k] ??= []).push(val);
    return g;
  }, [product.variants]);
  const groupKeys = Object.keys(groups);
  const simple = groupKeys.length <= 1; // one chip row of variant names

  const [sel, setSel] = useState<Record<string, string>>({});
  const [variantId, setVariantId] = useState<string | null>(hasVariants && product.variants.length === 1 ? product.variants[0]!.id : null);
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shake, setShake] = useState(false);

  const variant: Variant | null = useMemo(() => {
    if (!hasVariants) return null;
    if (simple) return product.variants.find((v) => v.id === variantId) ?? null;
    return product.variants.find((v) => groupKeys.every((k) => v.options[k] === sel[k])) ?? null;
  }, [hasVariants, simple, variantId, sel, product.variants, groupKeys]);

  const unit = variant?.price ?? product.price;
  const available = hasVariants ? (variant ? variant.stock : null) : product.stock;
  const tracked = product.trackStock;
  const anyInStock = !tracked || (hasVariants ? product.variants.some((v) => v.stock > 0) : product.stock > 0);
  const maxQty = tracked && available != null ? Math.max(1, Math.min(99, available)) : 99;
  const soldOutSelected = tracked && available != null && available <= 0;
  const needsChoice = hasVariants && !variant;

  useEffect(() => { if (qty > maxQty) setQty(maxQty); }, [maxQty, qty]);

  const bundleTiers = useMemo(() => {
    const tiers = new Map<number, number>();
    for (const b of bundles) if ((b.productId === null || b.productId === product.id) && (!tiers.has(b.minQty) || tiers.get(b.minQty)! < b.percent)) tiers.set(b.minQty, b.percent);
    return [...tiers.entries()].sort((a, b) => a[0] - b[0]);
  }, [bundles, product.id]);
  const pct = bestBundlePercent(product.id, qty, bundles);
  const offers = useMemo(() => offersFor(product.id, unit, bundles), [product.id, unit, bundles]);
  const hasOffers = offers.length > 1;
  const lineTotal = bundleLineTotal(product.id, unit, qty, bundles);
  const [customQty, setCustomQty] = useState(false);

  function requireChoice(): boolean {
    if (!needsChoice) return true;
    toast("error", t("cod.err.variant"));
    setShake(true);
    setTimeout(() => setShake(false), 500);
    document.getElementById("variant-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  }

  function openOrder() {
    if (!anyInStock || soldOutSelected) return; // sold out: never open the form
    if (!requireChoice()) return;
    track("AddToCart", { value: unit * qty, currency: st.currency, ids: [product.id] });
    if (st.placement === "popup") dialogRef.current?.showModal();
    else {
      setOpen(true);
      setTimeout(() => {
        document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
        document.getElementById("of-name")?.focus({ preventScroll: true });
      }, 60);
    }
  }
  useEffect(() => { if (autoOpen && st.placement !== "page" && !hasVariants) setTimeout(openOrder, 200); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function addToCart() {
    if (!requireChoice()) return;
    cart.add({ productId: product.id, variantId: variant?.id ?? null, qty, name: product.name, variantName: variant?.name ?? null, price: unit, image: product.image, slug: product.slug });
    track("AddToCart", { value: unit * qty, currency: st.currency, ids: [product.id] });
    setDrawer(true);
  }

  const lines = [{ productId: product.id, variantId: variant?.id ?? null, name: product.name, variantName: variant?.name ?? null, unitPrice: unit, qty, image: product.image }];
  const pageHref = `/checkout?p=${product.id}${variant ? `&v=${variant.id}` : ""}&q=${qty}`;
  const productLabel = tr(product.name, st.lang);

  const picker = (
    <div className="space-y-5">
      {hasVariants && (
        <div id="variant-picker" className={shake ? "animate-[wiggle_.4s]" : ""}>
          {simple ? (
            <fieldset>
              <legend className="label">{t("p.chooseOptions")}</legend>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const out = tracked && v.stock <= 0;
                  return (
                    <button key={v.id} type="button" disabled={out} aria-pressed={variantId === v.id} onClick={() => setVariantId(v.id)}
                      className={`border-2 px-4 py-2.5 text-sm font-extrabold uppercase transition ${variantId === v.id ? "border-ink bg-ink text-bg shadow-[3px_3px_0_var(--brand)]" : "border-ink bg-surface hover:bg-sunken"} ${out ? "cursor-not-allowed line-through opacity-40" : ""}`}>
                      {v.name}
                      {v.price !== product.price && <span className="num ms-2 text-xs opacity-70">{fmt(v.price)}</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            groupKeys.map((k) => (
              <fieldset key={k} className="mb-4">
                <legend className="label">{t("p.select", { opt: k })}</legend>
                <div className="flex flex-wrap gap-2">
                  {groups[k]!.map((val) => {
                    const possible = product.variants.some((v) => v.options[k] === val && groupKeys.every((g) => g === k || !sel[g] || v.options[g] === sel[g]) && (!tracked || v.stock > 0));
                    return (
                      <button key={val} type="button" disabled={!possible} aria-pressed={sel[k] === val} onClick={() => setSel((s) => ({ ...s, [k]: val }))}
                        className={`border-2 px-4 py-2.5 text-sm font-extrabold uppercase transition ${sel[k] === val ? "border-ink bg-ink text-bg shadow-[3px_3px_0_var(--brand)]" : "border-ink bg-surface hover:bg-sunken"} ${!possible ? "cursor-not-allowed line-through opacity-40" : ""}`}>{val}</button>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}
        </div>
      )}
      {hasOffers && <OfferCards offers={offers} qty={qty} setQty={setQty} maxQty={maxQty} fmt={fmt} customQty={customQty} setCustomQty={setCustomQty} template={bundles.find((b) => b.template)?.template} fallbackImage={product.image} />}
      {(!hasOffers || customQty || !offers.some((o) => o.qty === qty)) && <div>
        <span className="label" id="qty-l">{t("p.qty")}</span>
        <div className="flex items-center gap-3">
          <div role="group" aria-labelledby="qty-l" className="inline-flex items-center border-2 border-ink bg-surface">
            <button type="button" aria-label="−" className="grid size-11 place-items-center hover:bg-sunken disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}><Minus className="size-4" /></button>
            <output className="num w-10 text-center font-bold" aria-live="polite">{qty}</output>
            <button type="button" aria-label="+" className="grid size-11 place-items-center hover:bg-sunken disabled:opacity-40" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}><Plus className="size-4" /></button>
          </div>
          {tracked && available != null && available > 0 && available <= 5 && <span className="text-sm font-semibold text-danger">{t("p.onlyLeft", { n: available })}</span>}
        </div>
      </div>}
      {st.bundlesInForm && !hasOffers && bundleTiers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {bundleTiers.map(([n, p]) => (
            <button key={n} type="button" onClick={() => setQty(Math.min(maxQty, n))} className={`border-2 px-3 py-1.5 text-xs font-extrabold uppercase transition ${qty >= n ? "border-ink bg-accent text-accent-ink" : "border-dashed border-ink bg-surface hover:bg-sunken"}`}>
              🎁 {t("cod.bundle", { n, pct: p })}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const canOrder = anyInStock && !soldOutSelected;
  const ctaLabel = !anyInStock || soldOutSelected ? t("p.soldOut") : st.codMode ? t("cod.orderNow") : t("cart.add");
  const cta = (cls: string, sticky = false) => {
    if (st.codMode && st.placement === "page" && canOrder && !needsChoice) {
      return <Link href={pageHref} className={`btn btn-primary ${cls}`}><Zap className="size-5" aria-hidden />{sticky ? t("cod.orderNowShort") : ctaLabel}</Link>;
    }
    return (
      <button type="button" disabled={!canOrder} onClick={st.codMode ? openOrder : addToCart} className={`btn btn-primary ${cls}`}>
        {st.codMode ? <Zap className="size-5" aria-hidden /> : <ShoppingBag className="size-5" aria-hidden />}
        {sticky && st.codMode ? t("cod.orderNowShort") : ctaLabel}
      </button>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span dir="ltr" className="num display border-2 border-ink bg-accent px-3 py-1 text-4xl font-extrabold text-accent-ink shadow-[4px_4px_0_var(--ink)]">{fmt(unit)}</span>
        {product.compareAt && product.compareAt > unit && <span dir="ltr" className="num text-lg text-muted line-through">{fmt(product.compareAt)}</span>}
        {product.compareAt && product.compareAt > unit && <span className="sticker border-2 border-ink bg-brand px-2.5 py-1 text-xs font-extrabold text-brand-ink">{t("p.save", { pct: Math.round(((product.compareAt - unit) / product.compareAt) * 100) })}</span>}
      </div>
      {pct > 0 && !hasOffers && <p className="mt-1 text-sm font-semibold text-ok">🎁 {t("cod.bundle", { n: qty, pct })}</p>}

      <div className="mt-6">{picker}</div>

      <div className="mt-6">{cta("btn-lg w-full text-base")}</div>
      {st.codMode && <p className="mt-2 text-center text-xs text-muted">{t("cod.payOnDelivery")}</p>}

      {/* inline placement */}
      {st.codMode && st.placement === "inline" && open && (
        <section id="order" className="card mt-6 scroll-mt-28 animate-fade p-5" aria-label={t("cod.title")}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-xl font-extrabold">{t("cod.title")}</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label={t("cod.close")}><X className="size-4" /></button>
          </div>
          <OrderForm lines={lines} bundles={bundles} cities={cities} source="product-inline" productName={productLabel} />
        </section>
      )}

      {/* popup placement: bottom sheet on mobile, modal on desktop */}
      {st.codMode && st.placement === "popup" && (
        <dialog ref={dialogRef} aria-label={t("cod.title")}
          className="m-0 mt-auto max-h-[94dvh] w-full max-w-none overflow-y-auto overscroll-contain border-2 border-ink bg-bg p-0 text-ink backdrop:bg-black/55 backdrop:backdrop-blur-[2px] open:animate-sheet-up md:m-auto md:max-w-lg md:border-2"
          onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current?.close(); }}>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/95 px-5 py-3 backdrop-blur">
            <div className="min-w-0"><h2 className="display text-lg font-extrabold">{t("cod.title")}</h2><p className="truncate text-xs text-muted">{productLabel}</p></div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => dialogRef.current?.close()} aria-label={t("cod.close")}><X className="size-5" /></button>
          </div>
          <div className="p-5 pb-8">
            <OrderForm lines={lines} bundles={bundles} cities={cities} source="product-popup" productName={productLabel} header={<div className="rounded-xl bg-sunken p-4">{picker}</div>} />
          </div>
        </dialog>
      )}

      {/* sticky mobile bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-bg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 leading-tight"><p className="truncate text-xs text-muted">{productLabel}</p><p dir="ltr" className="num text-lg font-extrabold">{fmt(lineTotal)}</p></div>
          {cta("btn-lg ms-auto flex-1 !text-base", true)}
        </div>
      </div>
    </div>
  );
}
