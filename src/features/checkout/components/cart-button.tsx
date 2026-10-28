"use client";
import { ShoppingBag } from "lucide-react";
import { cartCount, setDrawer, useCart } from "../cart-store";

export function CartButton({ label, showLabel = false, className = "btn btn-ghost btn-sm relative" }: { label: string; showLabel?: boolean; className?: string }) {
  const lines = useCart();
  const n = cartCount(lines);
  return (
    <button type="button" aria-label={`${label} (${n})`} className={className} onClick={() => setDrawer(true)}>
      <ShoppingBag className="size-[1.15rem]" strokeWidth={1.5} aria-hidden />
      {showLabel && <span>{label}</span>}
      {n > 0 && (showLabel
        ? <span className="num ms-auto text-xs text-brand">({n})</span>
        : <span className="num absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-medium leading-4 text-brand-ink">{n}</span>)}
    </button>
  );
}
