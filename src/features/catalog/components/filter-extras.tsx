"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { parseOptions, stringifyOptions } from "@/lib/shop-filters";

const THUMB = "pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow";

type Facets = { currency: string; price: { min: number; max: number } | null; options: { name: string; values: { v: string; n: number }[] }[] };

/** Enhances the plain filter form: a price slider and attribute checkboxes that apply instantly. Without JS the form still works. */
export function FilterExtras({ q, category, min, max, opt, labels }: { q: string; category: string; min: string; max: string; opt: string; labels: { price: string; active: string; clearAll: string } }) {
  const root = useRef<HTMLDivElement>(null);
  const [f, setF] = useState<Facets | null>(null);
  const [sel, setSel] = useState<Record<string, string[]>>(() => parseOptions(opt));
  const [lo, setLo] = useState(min === "" ? NaN : Number(min));
  const [hi, setHi] = useState(max === "" ? NaN : Number(max));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const u = new URLSearchParams(); if (q) u.set("q", q); if (category) u.set("category", category);
    void fetch(`/api/shop/facets?${u}`).then((r) => (r.ok ? (r.json() as Promise<Facets>) : null)).then((d) => setF(d)).catch(() => {});
  }, [q, category]);

  const form = () => root.current?.closest("form") ?? null;
  const field = (name: string) => form()?.elements.namedItem(name) as HTMLInputElement | null;
  const apply = (next: { lo?: number; hi?: number; sel?: Record<string, string[]> }, delay = 0) => {
    const fm = form(); if (!fm) return;
    const l = next.lo ?? lo, h = next.hi ?? hi;
    const mn = field("min"), mx = field("max");
    const range = f?.price;
    if (mn) mn.value = Number.isFinite(l) && range && l > range.min ? String(l) : "";
    if (mx) mx.value = Number.isFinite(h) && range && h < range.max ? String(h) : "";
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fm.requestSubmit(), delay);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const range = f?.price && f.price.max > f.price.min ? f.price : null;
  const curLo = range ? Math.min(Math.max(Number.isFinite(lo) ? lo : range.min, range.min), range.max) : 0;
  const curHi = range ? Math.min(Math.max(Number.isFinite(hi) ? hi : range.max, range.min), range.max) : 0;
  const toggle = (k: string, v: string) => {
    const list = sel[k] ?? [];
    const next = { ...sel, [k]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] };
    if (!next[k]!.length) delete next[k];
    setSel(next); apply({ sel: next }, 250);
  };
  const step = range ? Math.max(1, Math.round((range.max - range.min) / 100)) : 1;
  const onLo = (n: number) => { const v = Math.min(n, curHi); setLo(v); apply({ lo: v }, 500); };
  const onHi = (n: number) => { const v = Math.max(n, curLo); setHi(v); apply({ hi: v }, 500); };
  const chips = Object.entries(sel).flatMap(([k, vs]) => vs.map((v) => ({ k, v })));
  const priceActive = Number.isFinite(lo) || Number.isFinite(hi);
  const clearAll = () => { setSel({}); setLo(NaN); setHi(NaN); const mn = field("min"), mx = field("max"); if (mn) mn.value = ""; if (mx) mx.value = ""; setTimeout(() => form()?.requestSubmit(), 50); };

  return (
    <div ref={root} className="space-y-5">
      <input type="hidden" name="opt" value={stringifyOptions(sel)} readOnly />
      {range && (
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-muted"><span>{labels.price}</span><span dir="ltr" className="tabular-nums text-ink">{curLo} – {curHi}</span></div>
          <div className="relative h-8" dir="ltr">
            <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-sunken" />
            <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand" style={{ left: `${((curLo - range.min) / (range.max - range.min)) * 100}%`, right: `${100 - ((curHi - range.min) / (range.max - range.min)) * 100}%` }} />
            <input type="range" aria-label="min" min={range.min} max={range.max} step={step} value={curLo} onChange={(e) => onLo(Number(e.target.value))} className={THUMB} />
            <input type="range" aria-label="max" min={range.min} max={range.max} step={step} value={curHi} onChange={(e) => onHi(Number(e.target.value))} className={THUMB} />
          </div>
        </div>
      )}
      {f?.options.map((o) => (
        <fieldset key={o.name}>
          <legend className="label">{o.name}</legend>
          <div className="flex flex-wrap gap-1.5">
            {o.values.map(({ v, n }) => {
              const on = sel[o.name]?.includes(v);
              return (
                <button type="button" key={v} aria-pressed={!!on} onClick={() => toggle(o.name, v)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-brand"}`}>
                  {v} <span className="opacity-60">{n}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      {(chips.length > 0 || priceActive) && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-muted">{labels.active}<button type="button" onClick={clearAll} className="font-semibold normal-case underline">{labels.clearAll}</button></div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map(({ k, v }) => <button type="button" key={k + v} onClick={() => toggle(k, v)} className="inline-flex items-center gap-1 rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold">{k}: {v}<X className="size-3" aria-hidden /></button>)}
            {priceActive && <button type="button" onClick={() => { setLo(NaN); setHi(NaN); apply({ lo: NaN, hi: NaN }, 0); }} className="inline-flex items-center gap-1 rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold" dir="ltr">{curLo}–{curHi}<X className="size-3" aria-hidden /></button>}
          </div>
        </div>
      )}
    </div>
  );
}
