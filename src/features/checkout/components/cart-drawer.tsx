"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { cart, cartCount, setDrawer, useCart, useDrawerOpen } from "../cart-store";
import { formatMoney } from "@/lib/money";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";

type Labels = { title: string; empty: string; view: string; checkout: string; remove: string; subtotal: string; freeHint: string; freeOk: string; close: string };

/** Slide-over cart (native <dialog>: focus trap, Esc to close). Only mounted when COD mode is OFF. */
export function CartDrawer({ currency, lang, threshold, labels }: { currency: string; lang: Lang; threshold: number; labels: Labels }) {
  const lines = useCart();
  const open = useDrawerOpen();
  const ref = useRef<HTMLDialogElement>(null);
  const fmt = (n: number) => formatMoney(n, currency, lang);
  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-label={labels.title} onClose={() => setDrawer(false)} onClick={(e) => { if (e.target === ref.current) setDrawer(false); }}
      className="m-0 ms-auto h-dvh max-h-none w-full max-w-md bg-bg p-0 text-ink backdrop:bg-black/50 open:animate-fade">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="display text-xl font-extrabold">{labels.title} <span className="num text-muted">({cartCount(lines)})</span></h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDrawer(false)} aria-label={labels.close}><X className="size-5" /></button>
        </div>
        {lines.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center text-muted"><div><ShoppingBag className="mx-auto mb-3 size-10" /><p>{labels.empty}</p></div></div>
        ) : (
          <>
            {threshold > 0 && (
              <div className="border-b border-line bg-brand-soft px-5 py-3 text-sm">
                <p className="mb-1.5 font-semibold">{subtotal >= threshold ? labels.freeOk : labels.freeHint.replace("{amount}", fmt(threshold - subtotal))}</p>
                <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }} /></div>
              </div>
            )}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.image ? <img src={fileUrl(l.image)} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <div className="size-20 shrink-0 rounded-xl bg-sunken" />}
                  <div className="min-w-0 flex-1">
                    <Link href={`/p/${l.slug}`} onClick={() => setDrawer(false)} className="line-clamp-2 font-semibold hover:text-brand">{tr(l.name, lang)}</Link>
                    {l.variantName && <p className="text-sm text-muted">{l.variantName}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-line">
                        <button aria-label="−" className="grid size-8 place-items-center hover:bg-sunken" onClick={() => cart.setQty(l.key, l.qty - 1)} disabled={l.qty <= 1}><Minus className="size-3.5" /></button>
                        <span className="num w-8 text-center text-sm font-bold">{l.qty}</span>
                        <button aria-label="+" className="grid size-8 place-items-center hover:bg-sunken" onClick={() => cart.setQty(l.key, l.qty + 1)}><Plus className="size-3.5" /></button>
                      </div>
                      <span dir="ltr" className="num font-bold">{fmt(l.price * l.qty)}</span>
                    </div>
                  </div>
                  <button aria-label={labels.remove} className="btn btn-ghost btn-sm self-start text-muted hover:text-danger" onClick={() => cart.remove(l.key)}><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              <p className="flex justify-between font-bold"><span>{labels.subtotal}</span><span dir="ltr" className="num text-lg">{fmt(subtotal)}</span></p>
              <Link href="/checkout" onClick={() => setDrawer(false)} className="btn btn-primary btn-lg w-full">{labels.checkout}</Link>
              <Link href="/cart" onClick={() => setDrawer(false)} className="btn btn-outline w-full">{labels.view}</Link>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
