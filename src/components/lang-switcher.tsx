"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import { setLang } from "@/features/settings/actions/lang";
import type { Lang } from "@/lib/i18n-core";
import { useLangMetas, useLangUi } from "./lang-context";
import { Flag } from "./flags";

/** Language menu: soft-rounded flags, closes on outside click / Escape / choosing a language. */
export function LangSwitcher({ current, langs, label }: { current: Lang; langs: Lang[]; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const metas = useLangMetas();
  const { style } = useLangUi();
  const nameOf = (l: string) => metas.find((m) => m.code === l)?.native ?? l;
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", key); window.addEventListener("scroll", () => setOpen(false), { passive: true, once: true });
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  if (langs.length < 2) return null;
  return (
    <div ref={root} className="relative" data-lang-switcher>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-sm gap-1.5 !px-2 sm:!px-3">
        {style !== "name" && style !== "code" && <Flag lang={current} />}
        {style === "flag-code" || style === "code" ? <span className="text-xs font-bold uppercase">{current}</span> : null}
        {style === "name" && <span className="text-xs font-bold">{nameOf(current)}</span>}
        <ChevronDown className={`hidden size-3.5 opacity-60 transition sm:block ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div role="menu" aria-label={label} className="absolute end-0 top-full z-50 mt-1 min-w-44 overflow-hidden rounded-xl border border-line bg-surface p-1 text-ink shadow-xl">
          {langs.map((l) => (
            <button key={l} type="button" role="menuitemradio" aria-checked={l === current} lang={l} disabled={pending}
              onClick={() => { setOpen(false); if (l !== current) start(async () => {
                await setLang(l);
                // on a language URL (/ar/…) stay on the matching URL of the new language
                const m = /^\/(ar|fr|en)(?=\/|$)/.exec(location.pathname);
                if (m) location.assign(`/${l}${location.pathname.slice(3)}${location.search}`);
              }); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm hover:bg-sunken ${l === current ? "font-bold text-brand" : "text-ink"}`}>
              <Flag lang={l} />
              <span className="flex-1">{nameOf(l)}</span>
              {l === current && <Check className="size-4" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
