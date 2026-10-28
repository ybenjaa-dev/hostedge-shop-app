"use client";
import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { fileUrl } from "@/lib/storage";

export type PickItem = { id: string; name: string; image: string | null };

/** Choose up to `max` other products (search by name); submits their ids as JSON in a hidden input named `name`. */
export function ProductPicker({ name, all, value, max, label, hint }: { name: string; all: PickItem[]; value: string[]; max: number; label: string; hint?: string }) {
  const [ids, setIds] = useState(value);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const byId = useMemo(() => new Map(all.map((p) => [p.id, p])), [all]);
  const chosen = ids.map((i) => byId.get(i)).filter(Boolean) as PickItem[];
  const results = useMemo(() => all.filter((p) => !ids.includes(p.id) && p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8), [all, ids, q]);
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(ids)} />
      <span className="label">{label} <span className="font-normal text-muted">({ids.length}/{max})</span></span>
      <ul className="mb-2 space-y-1.5">
        {chosen.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2">
            <span className="block size-10 shrink-0 overflow-hidden rounded-lg bg-sunken">{p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(p.image, "thumb")} alt="" className="size-full object-cover" />}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
            <button type="button" className="btn btn-ghost btn-sm !px-2 text-danger" aria-label={`Remove ${p.name}`} onClick={() => setIds(ids.filter((x) => x !== p.id))}><X className="size-4" /></button>
          </li>
        ))}
      </ul>
      {ids.length < max && (
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} placeholder="Search a product to add…" aria-label={`Add to ${label}`} className="field !min-h-10 !ps-9" />
          {open && results.length > 0 && (
            <ul role="listbox" className="absolute inset-x-0 z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl">
              {results.map((p) => (
                <li key={p.id}><button type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => { setIds([...ids, p.id]); setQ(""); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg p-2 text-start hover:bg-sunken">
                  <span className="block size-9 shrink-0 overflow-hidden rounded-md bg-sunken">{p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(p.image, "thumb")} alt="" className="size-full object-cover" />}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span><Plus className="size-4 text-muted" aria-hidden /></button></li>
              ))}
            </ul>
          )}
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
