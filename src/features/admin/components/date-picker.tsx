"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

/* ISO yyyy-mm-dd helpers — plain local calendar dates, no timezone shifts */
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string | null | undefined): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s ?? "");
  if (!m) return null;
  const d = new Date(+m[1]!, +m[2]! - 1, +m[3]!);
  return Number.isNaN(d.getTime()) ? null : d;
};
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const fmt = (s: string) => { const d = parse(s); return d ? `${d.getDate()} ${MONTHS[d.getMonth()]!.slice(0, 3)} ${d.getFullYear()}` : ""; };

/** 6×7 grid of dates for a month, Monday first. */
function grid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => addDays(first, i - lead));
}

type CalProps = { month: Date; setMonth: (d: Date) => void; sel: (d: Date) => "single" | "start" | "end" | "in" | null; onPick: (d: Date) => void; onHover?: (d: Date | null) => void; min?: string; max?: string; focusDay: string; setFocusDay: (s: string) => void };

function Calendar({ month, setMonth, sel, onPick, onHover, min, max, focusDay, setFocusDay }: CalProps) {
  const days = useMemo(() => grid(month.getFullYear(), month.getMonth()), [month]);
  const today = iso(new Date());
  const ref = useRef<HTMLDivElement>(null);
  const move = (n: number) => {
    const d = addDays(parse(focusDay) ?? new Date(), n);
    setFocusDay(iso(d));
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>(`[data-d="${iso(d)}"]`)?.focus());
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) { e.preventDefault(); move(map[e.key]!); }
    else if (e.key === "PageUp") { e.preventDefault(); move(-30); }
    else if (e.key === "PageDown") { e.preventDefault(); move(30); }
  };
  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);
  return (
    <div ref={ref} onKeyDown={onKey}>
      <div className="mb-2 flex items-center gap-1">
        <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4 rtl:rotate-180" /></button>
        <div className="flex min-w-0 flex-1 justify-center gap-1">
          <select aria-label="Month" className="field !min-h-8 !w-auto !rounded-lg !px-2 !py-0 text-sm font-bold" value={month.getMonth()} onChange={(e) => setMonth(new Date(month.getFullYear(), +e.target.value, 1))}>{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
          <select aria-label="Year" className="field num !min-h-8 !w-auto !rounded-lg !px-2 !py-0 text-sm font-bold" value={month.getFullYear()} onChange={(e) => setMonth(new Date(+e.target.value, month.getMonth(), 1))}>{(years.includes(month.getFullYear()) ? years : [...years, month.getFullYear()].sort()).map((y) => <option key={y} value={y}>{y}</option>)}</select>
        </div>
        <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4 rtl:rotate-180" /></button>
      </div>
      <div className="dp-grid" role="grid" aria-label={`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}>
        {DOW.map((d) => <span key={d} className="dp-dow" role="columnheader">{d}</span>)}
        {days.map((d) => {
          const k = iso(d);
          const st = sel(d);
          const out = d.getMonth() !== month.getMonth();
          const dis = (min && k < min) || (max && k > max) || false;
          return (
            <button key={k} type="button" role="gridcell" data-d={k} disabled={dis} tabIndex={k === focusDay ? 0 : -1} aria-selected={st === "single" || st === "start" || st === "end"} aria-label={fmt(k)}
              onMouseEnter={() => onHover?.(d)} onClick={() => onPick(d)} onFocus={() => setFocusDay(k)}
              className={`dp-day ${out ? "is-out" : ""} ${k === today ? "is-today" : ""} ${st === "in" ? "is-in" : ""} ${st && st !== "in" ? "is-sel" : ""}`}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

/** Popover plumbing: opens under the trigger, closes on outside click / Escape, returns focus. */
function usePopover() {
  const [open, setOpenRaw] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  /** Opens left-aligned, or right-aligned when the popover would run off the right edge of the screen. */
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => {
    setOpenRaw((o) => {
      const next = typeof v === "function" ? v(o) : v;
      if (next && !o) { const r = root.current?.getBoundingClientRect(); if (r) setAlignEnd(r.left + 544 > window.innerWidth - 8); }
      return next;
    });
  };
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("mousedown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return { open, setOpen, root, trigger, alignEnd };
}

const triggerCls = "field flex !min-h-11 w-full items-center gap-2 text-start";

/** A modern single-date field. Submits `name` as `yyyy-mm-dd` (or `yyyy-mm-ddThh:mm` with `withTime`). */
export function DateField({ name, defaultValue = "", label, placeholder = "Select date", min, max, withTime = false, clearable = true, className = "", ariaLabel, onChange }: {
  name: string; defaultValue?: string; label?: string; placeholder?: string; min?: string; max?: string; withTime?: boolean; clearable?: boolean; className?: string; ariaLabel?: string; onChange?: (v: string) => void;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const date = parse(value);
  const time = /T(\d{2}):(\d{2})/.exec(value);
  const [hh, mm] = [time?.[1] ?? "09", time?.[2] ?? "00"];
  const { open, setOpen, root, trigger, alignEnd } = usePopover();
  const [month, setMonth] = useState(() => { const d = date ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [focusDay, setFocusDay] = useState(() => iso(date ?? new Date()));
  const set = useCallback((v: string) => { setValue(v); onChange?.(v); }, [onChange]);
  const commit = (d: Date, h = hh, m = mm) => set(withTime ? `${iso(d)}T${h}:${m}` : iso(d));
  return (
    <div ref={root} className={`relative ${className}`}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <input type="hidden" name={name} value={value} />
      <button ref={trigger} id={id} type="button" className={triggerCls} aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel}
        onClick={() => { const d = parse(value) ?? new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setFocusDay(iso(d)); setOpen((o) => !o); }}>
        <CalendarDays className="size-4 shrink-0 text-muted" aria-hidden />
        <span className={`min-w-0 flex-1 truncate ${date ? "" : "text-muted"}`}>{date ? `${fmt(value)}${withTime ? `, ${hh}:${mm}` : ""}` : placeholder}</span>
        {clearable && date && <span role="button" tabIndex={0} aria-label="Clear date" className="grid size-5 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink" onClick={(e) => { e.stopPropagation(); set(""); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); set(""); } }}><X className="size-3.5" /></span>}
      </button>
      {open && (
        <div className={`dp-pop ${alignEnd ? "dp-end" : ""}`} role="dialog" aria-label="Choose a date">
          <Calendar month={month} setMonth={setMonth} focusDay={focusDay} setFocusDay={setFocusDay} min={min} max={max}
            sel={(d) => (date && iso(d) === iso(date) ? "single" : null)}
            onPick={(d) => { commit(d); if (!withTime) { setOpen(false); trigger.current?.focus(); } }} />
          {withTime && (
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">Time</span>
              <select aria-label="Hour" className="field num !min-h-9 !w-auto !py-0" value={hh} onChange={(e) => commit(date ?? new Date(), e.target.value, mm)}>{Array.from({ length: 24 }, (_, i) => pad(i)).map((h) => <option key={h}>{h}</option>)}</select>
              <span aria-hidden>:</span>
              <select aria-label="Minute" className="field num !min-h-9 !w-auto !py-0" value={mm} onChange={(e) => commit(date ?? new Date(), hh, e.target.value)}>{["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => <option key={m}>{m}</option>)}</select>
              <button type="button" className="btn btn-primary btn-sm ms-auto" onClick={() => { if (!date) commit(new Date()); setOpen(false); }}>Done</button>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { set(""); setOpen(false); }}>Clear</button>
            <button type="button" className="btn btn-ghost btn-sm text-brand" onClick={() => { const t = new Date(); setMonth(new Date(t.getFullYear(), t.getMonth(), 1)); commit(t); if (!withTime) setOpen(false); }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

const PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: "Today", range: () => { const t = iso(new Date()); return [t, t]; } },
  { label: "Yesterday", range: () => { const t = iso(addDays(new Date(), -1)); return [t, t]; } },
  { label: "Last 7 days", range: () => [iso(addDays(new Date(), -6)), iso(new Date())] },
  { label: "Last 30 days", range: () => [iso(addDays(new Date(), -29)), iso(new Date())] },
  { label: "This month", range: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(new Date())]; } },
  { label: "Last month", range: () => { const n = new Date(); return [iso(new Date(n.getFullYear(), n.getMonth() - 1, 1)), iso(new Date(n.getFullYear(), n.getMonth(), 0))]; } },
];

/** One field for a from–to range with quick presets. Submits two inputs: `fromName` and `toName` (both `yyyy-mm-dd`). */
export function DateRangeField({ fromName = "from", toName = "to", from = "", to = "", label, className = "" }: { fromName?: string; toName?: string; from?: string; to?: string; label?: string; className?: string }) {
  const id = useId();
  const [range, setRange] = useState<[string, string]>([from, to]);
  const [pick, setPick] = useState<string | null>(null); // first click waiting for the second
  const [hover, setHover] = useState<Date | null>(null);
  const { open, setOpen, root, trigger, alignEnd } = usePopover();
  const start = parse(range[0]);
  const [month, setMonth] = useState(() => { const d = start ?? new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [focusDay, setFocusDay] = useState(() => iso(start ?? new Date()));
  const [a, b] = pick ? [pick, hover ? iso(hover) : pick].sort() as [string, string] : range;
  const text = range[0] && range[1] ? (range[0] === range[1] ? fmt(range[0]) : `${fmt(range[0])} – ${fmt(range[1])}`) : range[0] ? `From ${fmt(range[0])}` : range[1] ? `Until ${fmt(range[1])}` : "";
  const apply = (r: [string, string]) => { setRange(r); setPick(null); setOpen(false); trigger.current?.focus(); };
  return (
    <div ref={root} className={`relative ${className}`}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <input type="hidden" name={fromName} value={range[0]} /><input type="hidden" name={toName} value={range[1]} />
      <button ref={trigger} id={id} type="button" className={triggerCls} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <CalendarDays className="size-4 shrink-0 text-muted" aria-hidden />
        <span className={`min-w-0 flex-1 truncate ${text ? "" : "text-muted"}`}>{text || "Any date"}</span>
        {text && <span role="button" tabIndex={0} aria-label="Clear dates" className="grid size-5 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink" onClick={(e) => { e.stopPropagation(); setRange(["", ""]); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setRange(["", ""]); } }}><X className="size-3.5" /></span>}
      </button>
      {open && (
        <div className={`dp-pop dp-wide ${alignEnd ? "dp-end" : ""}`} role="dialog" aria-label="Choose a date range">
          <div className="flex flex-col gap-3 sm:flex-row">
            <ul className="flex shrink-0 flex-wrap gap-1.5 sm:w-32 sm:flex-col sm:gap-0.5" aria-label="Quick ranges">
              {PRESETS.map((p) => <li key={p.label}><button type="button" className="w-full rounded-lg px-2.5 py-1.5 text-start text-sm font-semibold text-ink/80 hover:bg-sunken" onClick={() => apply(p.range())}>{p.label}</button></li>)}
            </ul>
            <div className="min-w-0 flex-1">
              <Calendar month={month} setMonth={setMonth} focusDay={focusDay} setFocusDay={setFocusDay} onHover={(d) => pick && setHover(d)}
                sel={(d) => { const k = iso(d); if (!a) return null; if (k === a && (!b || a === b)) return "single"; if (k === a) return "start"; if (b && k === b) return "end"; return b && k > a && k < b ? "in" : null; }}
                onPick={(d) => { const k = iso(d); if (!pick) { setPick(k); setHover(null); } else apply([pick, k].sort() as [string, string]); }} />
              <p className="mt-2 text-xs text-muted" aria-live="polite">{pick ? "Now pick the last day." : "Pick the first day, then the last day."}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
