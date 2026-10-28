"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { previewFontsUrl, googleFontsUrl } from "@/lib/fonts";

/** Adds a stylesheet once, without suspending the page (React's `precedence` links make the whole preview flash while they load). */
export function useStylesheet(href: string | null) {
  useEffect(() => {
    if (!href) return;
    let el = document.head.querySelector<HTMLLinkElement>(`link[data-studio-font="${CSS.escape(href)}"]`);
    if (!el) { el = document.createElement("link"); el.rel = "stylesheet"; el.href = href; el.dataset.studioFont = href; document.head.appendChild(el); }
  }, [href]);
}
/** Loads the brand fonts for the live preview. */
export const useBrandFonts = (latin: string, arabic: string) => useStylesheet(googleFontsUrl(latin, arabic));

/** A searchable list where every font is drawn in its own face. Picking one changes the preview in place — no reload. */
export function FontPicker({ label, value, fonts, onChange, sample = "Aa Bb Cc — The quick brown fox" }: { label: string; value: string; fonts: readonly string[]; onChange: (f: string) => void; sample?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useStylesheet(open ? previewFontsUrl(fonts) : googleFontsUrl(value, value));
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away, true); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", away, true); document.removeEventListener("keydown", key); };
  }, [open]);
  const list = useMemo(() => fonts.filter((f) => f.toLowerCase().includes(q.trim().toLowerCase())), [fonts, q]);
  return (
    <div ref={root} className="relative">
      <span className="label" id={`${id}-l`}>{label}</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-l`} onClick={() => setOpen((o) => !o)} className="field flex w-full items-center justify-between gap-2 text-start">
        <span className="min-w-0"><span className="block truncate text-base font-semibold" style={{ fontFamily: `'${value}', system-ui` }}>{value}</span></span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <p className="mt-1.5 truncate text-sm text-muted" style={{ fontFamily: `'${value}', system-ui` }} dir="auto">{sample}</p>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3"><Search className="size-4 text-muted" aria-hidden /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${fonts.length} fonts…`} aria-label="Search fonts" className="min-h-11 w-full bg-transparent text-sm outline-none" /></div>
          <ul role="listbox" aria-labelledby={`${id}-l`} className="max-h-72 overflow-y-auto p-1.5">
            {list.map((f) => (
              <li key={f} role="option" aria-selected={f === value}>
                <button type="button" onClick={() => { onChange(f); setOpen(false); setQ(""); }} className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-start hover:bg-sunken ${f === value ? "bg-brand-soft" : ""}`}>
                  <span className="truncate text-lg" style={{ fontFamily: `'${f}', system-ui` }}>{f}</span>{f === value && <Check className="size-4 shrink-0 text-brand" aria-hidden />}
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted">No font matches “{q}”.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
