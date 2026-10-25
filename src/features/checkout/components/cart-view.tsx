"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { cart, useCart, type CartLine } from "../cart-store";
import { refreshCart } from "../actions";
import { useStore, useT, type CityOpt } from "../store-context";
import { computeTotals, freeShippingRemaining, type BundleRule } from "@/lib/pricing";
import { formatMoney } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { OrderForm } from "./order-form";

/** Re-prices the guest cart from the server once per mount. */
function useFreshCart() {
  const lines = useCart();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const cur = cart_snapshot();
    if (!cur.length) { setReady(true); return; }
    refreshCart({ items: cur.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })) }).then((r) => {
      if (r.ok) {
        const byKey = new Map(cur.map((l) => [`${l.productId}:${l.variantId ?? ""}`, l]));
        const next: CartLine[] = r.lines.map((l) => {
          const old = byKey.get(`${l.productId}:${l.variantId ?? ""}`)!;
          return { ...old, name: l.name, variantName: l.variantName, price: l.price, image: l.image, qty: l.available != null ? Math.min(l.qty, Math.max(1, l.available)) : l.qty };
        });
        cart.replace(next);
      }
      setReady(true);
    }).catch(() => setReady(true));
  }, []);
  return { lines, ready };
}
function cart_snapshot(): CartLine[] {
  try { return JSON.parse(localStorage.getItem("cart.v1") ?? "[]") as CartLine[]; } catch { return []; }
}

export function CartView({ bundles }: { bundles: BundleRule[] }) {
  const st = useStore();
  const t = useT();
  const { lines, ready } = useFreshCart();
  const [coupon, setCoupon] = useState("");
  const fmt = (n: number) => formatMoney(n, st.currency, st.lang);
  const totals = useMemo(() => computeTotals({ lines: lines.map((l) => ({ productId: l.productId, unitPrice: l.price, qty: l.qty })), bundles, shippingFee: st.defaultShippingFee, freeShippingThreshold: st.freeThreshold, codFee: st.codFee, taxRateBp: st.taxRateBp, taxInclusive: st.taxInclusive }), [lines, bundles, st]);

  if (!ready) return <div className="space-y-3" aria-busy>{[0, 1].map((i) => <div key={i} className="skeleton h-28 w-full" />)}</div>;
  if (!lines.length) return (
    <div className="card grid place-items-center gap-4 p-14 text-center"><ShoppingBag className="size-12 text-muted" /><p className="text-lg font-semibold">{t("cart.empty")}</p><Link href="/shop" className="btn btn-primary">{t("cart.continue")}</Link></div>
  );
  const remaining = freeShippingRemaining(totals.subtotal - totals.discount, st.freeThreshold);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <ul className="card divide-y divide-line px-5">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-4 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {l.image ? <img src={fileUrl(l.image)} alt="" className="size-24 shrink-0 rounded-xl object-cover" /> : <div className="size-24 shrink-0 rounded-xl bg-sunken" />}
            <div className="min-w-0 flex-1">
              <Link href={`/p/${l.slug}`} className="font-semibold hover:text-brand">{tr(l.name, st.lang)}</Link>
              {l.variantName && <p className="text-sm text-muted">{l.variantName}</p>}
              <p dir="ltr" className="num mt-1 text-sm text-muted">{fmt(l.price)}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex items-center rounded-lg border border-line">
                  <button aria-label="−" className="grid size-9 place-items-center hover:bg-sunken disabled:opacity-40" onClick={() => cart.setQty(l.key, l.qty - 1)} disabled={l.qty <= 1}><Minus className="size-4" /></button>
                  <span className="num w-9 text-center font-bold">{l.qty}</span>
                  <button aria-label="+" className="grid size-9 place-items-center hover:bg-sunken" onClick={() => cart.setQty(l.key, l.qty + 1)}><Plus className="size-4" /></button>
                </div>
                <button className="btn btn-ghost btn-sm text-muted hover:text-danger" onClick={() => cart.remove(l.key)}><Trash2 className="size-4" />{t("cart.remove")}</button>
              </div>
            </div>
            <p dir="ltr" className="num font-extrabold">{fmt(l.price * l.qty)}</p>
          </li>
        ))}
      </ul>
      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        {st.freeThreshold > 0 && (
          <div className="rounded-xl bg-brand-soft p-3 text-sm"><p className="mb-2 flex items-center gap-2 font-semibold"><Truck className="size-4 text-brand" />{remaining > 0 ? t("cod.freeShipHint", { amount: fmt(remaining) }) : t("cod.freeShipOk")}</p><div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, ((totals.subtotal - totals.discount) / st.freeThreshold) * 100)}%` }} /></div></div>
        )}
        <label className="block"><span className="label">{t("cod.coupon")}</span><input className="field uppercase" value={coupon} onChange={(e) => setCoupon(e.target.value)} /></label>
        <dl className="num space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>{t("cod.subtotal")}</dt><dd dir="ltr">{fmt(totals.subtotal)}</dd></div>
          {totals.discount > 0 && <div className="flex justify-between text-ok"><dt>{t("cod.discount")}</dt><dd dir="ltr">−{fmt(totals.discount)}</dd></div>}
          <div className="flex justify-between"><dt>{t("cod.shipping")}</dt><dd dir="ltr">{totals.shipping === 0 ? t("cod.free") : fmt(totals.shipping)}</dd></div>
          {totals.codFee > 0 && <div className="flex justify-between"><dt>{t("cod.codFee")}</dt><dd dir="ltr">{fmt(totals.codFee)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 text-lg font-extrabold"><dt>{t("cod.totalPlain")}</dt><dd dir="ltr">{fmt(totals.total)}</dd></div>
        </dl>
        <Link href={`/checkout${coupon.trim() ? `?coupon=${encodeURIComponent(coupon.trim())}` : ""}`} className="btn btn-primary btn-lg w-full">{t("cart.checkout")}</Link>
        <Link href="/shop" className="btn btn-ghost w-full">{t("cart.continue")}</Link>
      </aside>
    </div>
  );
}

export function CartCheckout({ bundles, cities, coupon }: { bundles: BundleRule[]; cities: CityOpt[]; coupon?: string }) {
  const t = useT();
  const { lines, ready } = useFreshCart();
  if (!ready) return <div className="skeleton h-96 w-full" aria-busy />;
  if (!lines.length) return <div className="card grid place-items-center gap-4 p-14 text-center"><p className="text-lg font-semibold">{t("cart.empty")}</p><Link href="/shop" className="btn btn-primary">{t("cart.continue")}</Link></div>;
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_26rem]">
      <section className="card p-5">
        <h2 className="display mb-1 text-xl font-extrabold">{t("checkout.contact")}</h2>
        <fieldset className="mb-5 mt-3 rounded-xl border-2 border-brand bg-brand-soft p-3">
          <legend className="sr-only">{t("cart.payment")}</legend>
          <label className="flex items-center gap-3 font-semibold"><input type="radio" checked readOnly className="size-5 accent-[var(--brand)]" />{t("cart.cod")}</label>
        </fieldset>
        <OrderForm lines={lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, variantName: l.variantName, unitPrice: l.price, qty: l.qty, image: l.image }))} bundles={bundles} cities={cities} source="cart" clearCartOnSuccess initialCoupon={coupon} productName={tr(lines[0]!.name, "en")} />
      </section>
    </div>
  );
}
