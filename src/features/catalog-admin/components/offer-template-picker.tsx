"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { OFFER_TEMPLATES, type OfferTemplate } from "@/lib/offer-templates";

const bar = "block rounded-full bg-current opacity-30";

/** Tiny schematic of each layout so the choice is visual. */
function Mini({ id }: { id: OfferTemplate | "default" }) {
  const box = "rounded-md border border-current/30 bg-surface";
  if (id === "tiles") return <span className="grid h-14 grid-cols-3 gap-1">{[0, 1, 2].map((i) => <span key={i} className={`${box} flex flex-col items-center justify-center gap-1 ${i === 1 ? "!border-brand" : ""}`}><span className="h-2.5 w-3 rounded-sm bg-current opacity-60" /><span className={`${bar} h-1 w-6`} /></span>)}</span>;
  if (id === "photo") return <span className="grid h-14 grid-cols-3 gap-1">{[0, 1, 2].map((i) => <span key={i} className={`${box} flex flex-col gap-1 p-1 ${i === 1 ? "!border-brand" : ""}`}><span className="block flex-1 rounded-sm bg-current opacity-20" /><span className={`${bar} h-1 w-full`} /></span>)}</span>;
  if (id === "pills") return <span className="flex h-14 items-center gap-1">{[0, 1, 2].map((i) => <span key={i} className={`${box} flex h-9 flex-1 flex-col items-center justify-center gap-1 ${i === 1 ? "!border-brand" : ""}`}><span className="h-2 w-3 rounded-sm bg-current opacity-60" /><span className={`${bar} h-1 w-5`} /></span>)}</span>;
  if (id === "highlight") return <span className="flex h-14 flex-col gap-1"><span className={`${box} flex h-4 items-center justify-between px-1.5`}><span className={`${bar} h-1 w-6`} /><span className={`${bar} h-1 w-4`} /></span><span className="flex h-7 items-center justify-between rounded-md bg-brand px-2 text-brand-ink"><span className="block h-1.5 w-8 rounded-full bg-current opacity-80" /><span className="block h-2 w-5 rounded-full bg-current" /></span><span className={`${box} flex h-4 items-center justify-between px-1.5`}><span className={`${bar} h-1 w-6`} /><span className={`${bar} h-1 w-4`} /></span></span>;
  if (id === "default") return <span className="grid h-14 place-items-center text-xs font-bold text-muted">Store default</span>;
  return <span className="flex h-14 flex-col justify-between">{[0, 1, 2].map((i) => <span key={i} className={`${box} flex h-4 items-center gap-1.5 px-1.5 ${i === 1 ? "!border-brand" : ""}`}><span className="size-2 shrink-0 rounded-full border border-current opacity-60" /><span className={`${bar} h-1 flex-1`} /><span className={`${bar} h-1 w-4`} /></span>)}</span>;
}

/** Radio cards for the offer-card layout. `allowDefault` adds "Use the store default" (per-product override). Submits `name`. */
export function OfferTemplatePicker({ name, value, allowDefault, defaultLabel }: { name: string; value: string; allowDefault?: boolean; defaultLabel?: string }) {
  const [v, setV] = useState(value);
  const items: { id: OfferTemplate | ""; name: string; hint: string }[] = [
    ...(allowDefault ? [{ id: "" as const, name: "Store default", hint: defaultLabel ? `Currently “${defaultLabel}”. Change it under Coupons & bundles.` : "Follows the store-wide choice." }] : []),
    ...OFFER_TEMPLATES,
  ];
  return (
    <fieldset>
      <legend className="sr-only">Offer card layout</legend>
      <input type="hidden" name={name} value={v} />
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const on = v === it.id;
          return (
            <label key={it.id || "default"} className={`relative flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-3 transition focus-within:outline focus-within:outline-2 focus-within:outline-brand ${on ? "border-brand bg-brand-soft" : "border-line hover:border-ink/30"}`}>
              <input type="radio" className="sr-only" name={`${name}-ui`} checked={on} onChange={() => setV(it.id)} />
              <Mini id={it.id || "default"} />
              <span className="flex items-center justify-between gap-2 text-sm font-extrabold">{it.name}{on && <span className="grid size-5 place-items-center rounded-full bg-brand text-brand-ink"><Check className="size-3" strokeWidth={3.5} aria-hidden /></span>}</span>
              <span className="text-xs leading-snug text-muted">{it.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
