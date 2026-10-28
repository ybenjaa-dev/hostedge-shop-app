import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { FilterExtras } from "./filter-extras";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string; view: string; opt?: string };
  categories: { slug: string; name: string; count: number }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; active?: string; clearAll?: string; apply: string; clear: string; search: string };
};

/** Horizontal toolbar: scrolling category chips + a collapsible price/search/stock form. Plain GET forms — no client JS. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const keep = (extra: Record<string, string>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: values.q, min: values.min, max: values.max, stock: values.stock, opt: values.opt ?? "", sort: values.sort === "new" ? "" : values.sort, view: values.view === "grid" ? "" : values.view, ...extra })) if (v) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  const chip = (on: boolean) => `skew shrink-0 px-4 py-1.5 text-sm font-black uppercase tracking-wider transition-colors ${on ? "lime" : "bg-sunken hover:bg-[var(--ink)] hover:text-[var(--bg)]"}`;
  const active = !!(values.q || values.min || values.max || values.stock || values.opt);
  return (
    <aside className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="list">
        <Link role="listitem" href={`/shop${keep({})}`} className={chip(!values.category)}><span>{labels.all}</span></Link>
        {categories.map((c) => (
          <Link role="listitem" key={c.slug} href={`/category/${c.slug}${keep({})}`} className={chip(values.category === c.slug)}><span>{c.name} <span className="num opacity-60">{c.count}</span></span></Link>
        ))}
      </div>
      <details className="group bg-surface" open={active}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-[0.18em] hover:text-[var(--brand)]"><SlidersHorizontal className="size-4" />{labels.filters}{active && <span className="size-2 bg-[var(--brand)]" />}</summary>
        <form action={action} method="get" className="grid gap-4 border-t border-line p-4 sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-end">
          {values.sort && values.sort !== "new" && <input type="hidden" name="sort" value={values.sort} />}
          {values.view === "list" && <input type="hidden" name="view" value="list" />}
          <div>
            <label className="label" htmlFor="f-q">{labels.search}</label>
            <input id="f-q" name="q" type="search" defaultValue={values.q} className="field" />
          </div>
          <div>
            <span className="label">{labels.price}</span>
            <div className="grid grid-cols-2 gap-2">
              <input name="min" inputMode="decimal" placeholder={labels.min} defaultValue={values.min} className="field" aria-label={labels.min} />
              <input name="max" inputMode="decimal" placeholder={labels.max} defaultValue={values.max} className="field" aria-label={labels.max} />
            </div>
          </div>
          <div className="sm:col-span-full"><FilterExtras q={values.q} category={values.category} min={values.min} max={values.max} opt={values.opt ?? ""} labels={{ price: labels.price, active: labels.active ?? "Active filters", clearAll: labels.clearAll ?? "Clear all" }} /></div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-4 accent-[var(--brand)]" />{labels.stock}</label>
          <div className="flex gap-2"><button className="btn btn-primary flex-1">{labels.apply}</button><a href={action} className="btn btn-outline">{labels.clear}</a></div>
        </form>
      </details>
    </aside>
  );
}
