"use client";
import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CityOpt } from "@/features/catalog/queries";
import type { Lang } from "@/lib/i18n-core";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Searchable city dropdown with full keyboard support (combobox pattern). */
export function CityCombobox({
  cities, value, onChange, lang, placeholder, label, invalid, errorId, disabledNote,
}: {
  cities: CityOpt[]; value: string | null; onChange: (id: string) => void; lang: Lang; placeholder: string; label: string; invalid?: boolean; errorId?: string; disabledNote: string;
}) {
  const id = useId();
  const selected = cities.find((c) => c.id === value);
  const nameOf = (c: CityOpt) => (lang === "ar" && c.nameAr ? c.nameAr : c.name);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const results = useMemo(() => {
    const n = norm(q.trim());
    if (!n) return cities;
    return cities.filter((c) => norm(c.name).includes(n) || norm(c.nameAr ?? "").includes(n) || norm(c.region ?? "").includes(n));
  }, [cities, q]);

  const pick = (c: CityOpt) => {
    if (!c.codAvailable) return;
    onChange(c.id);
    setQ("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="label" htmlFor={`${id}-input`}>{label}</label>
      <div className="relative">
        <input
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-invalid={invalid}
          aria-describedby={errorId}
          aria-activedescendant={open && results[active] ? `${id}-o-${results[active]!.id}` : undefined}
          autoComplete="off"
          className="field pe-9"
          placeholder={selected ? nameOf(selected) : placeholder}
          value={open ? q : selected ? nameOf(selected) : ""}
          onFocus={() => { setOpen(true); setActive(0); }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); listRef.current?.children[Math.min(active + 1, results.length - 1)]?.scrollIntoView({ block: "nearest" }); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); listRef.current?.children[Math.max(active - 1, 0)]?.scrollIntoView({ block: "nearest" }); }
            else if (e.key === "Enter" && open && results[active]) { e.preventDefault(); pick(results[active]!); }
            else if (e.key === "Escape") setOpen(false);
          }}
        />
        <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
      {open && (
        <ul id={`${id}-list`} ref={listRef} role="listbox" className="absolute inset-x-0 z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">—</li>}
          {results.map((c, i) => (
            <li
              key={c.id}
              id={`${id}-o-${c.id}`}
              role="option"
              aria-selected={c.id === value}
              aria-disabled={!c.codAvailable}
              onMouseDown={(e) => { e.preventDefault(); pick(c); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm ${i === active ? "bg-sunken" : ""} ${c.id === value ? "font-bold text-brand" : ""} ${!c.codAvailable ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span>{nameOf(c)}{c.region && <span className="ms-2 text-xs text-muted">{c.region}</span>}</span>
              {!c.codAvailable && <span className="text-xs text-danger">{disabledNote}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
