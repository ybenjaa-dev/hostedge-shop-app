"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";
import type { ChecklistItem } from "./queries";

const KEY = "hide-setup-checklist";

/** "Make it yours" card on the dashboard: what is still placeholder, one click to fix each. Can be hidden on this device. */
export function SetupChecklist({ items, done, total }: { items: ChecklistItem[]; done: number; total: number }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => { try { setHidden(localStorage.getItem(KEY) === "1"); } catch {} }, []);
  if (hidden || done === total) return null;
  const pct = Math.round((done / total) * 100);
  return (
    <section aria-labelledby="setup-h" className="card mb-5 overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-brand-soft p-4">
        <Sparkles className="size-5 text-brand" aria-hidden />
        <h2 id="setup-h" className="display text-lg font-extrabold">Make it yours</h2>
        <div className="flex min-w-40 flex-1 items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div><span className="num text-sm font-bold">{done}/{total}</span></div>
        <button type="button" className="btn btn-ghost btn-sm" aria-label="Hide this checklist" onClick={() => { try { localStorage.setItem(KEY, "1"); } catch {} setHidden(true); }}><X className="size-4" /></button>
      </div>
      <ul className="divide-y divide-line">
        {items.map((it) => (
          <li key={it.id}>
            <Link href={it.href} className={`flex items-center gap-3 p-3.5 hover:bg-sunken ${it.done ? "opacity-60" : ""}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${it.done ? "border-brand bg-brand text-brand-ink" : "border-line"}`}>{it.done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}</span>
              <span className="min-w-0 flex-1"><span className={`block font-semibold ${it.done ? "line-through" : ""}`}>{it.label}</span><span className="block text-sm text-muted">{it.detail}</span></span>
              {!it.done && <span className="btn btn-outline btn-sm shrink-0">{it.cta}<ChevronRight className="size-4 rtl:rotate-180" aria-hidden /></span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
