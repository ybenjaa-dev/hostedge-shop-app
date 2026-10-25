"use client";
import { ShoppingBag } from "lucide-react";
import { cartCount, setDrawer, useCart } from "../cart-store";

export function CartButton({ label }: { label: string }) {
  const lines = useCart();
  const n = cartCount(lines);
  return (
    <button type="button" aria-label={`${label} (${n})`} className="btn btn-ghost btn-sm relative" onClick={() => setDrawer(true)}>
      <ShoppingBag className="size-5" aria-hidden />
      {n > 0 && <span className="num absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-extrabold leading-5 text-brand-ink">{n}</span>}
    </button>
  );
}
