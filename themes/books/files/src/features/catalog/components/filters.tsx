import Link from "next/link";
import { SlidersHorizontal, Search } from "lucide-react";
import { FilterExtras } from "./filter-extras";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string; view: string; opt?: string };
  categories: { slug: string; name: string; count: number }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; active?: string; clearAll?: string; apply: string; clear: string; search: string };
};

/** Genre pills across the top, plus a slim search / price / availability form. Plain GET — no client JS. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const keep = (extra: Record<string, string>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: values.q, min: values.min, max: values.max, stock: values.stock, sort: values.sort === "new" ? "" : values.sort, view: values.view === "grid" ? "" : values.view, opt: values.opt ?? "", ...extra })) if (v) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  const refined = !!(values.min || values.max || values.stock || values.opt);
  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <nav aria-label={labels.category} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          <Link href={`/shop${keep({})}`} aria-current={!values.category ? "true" : undefined} className={`pill ${!values.category ? "is-on" : ""}`}>{labels.all}</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}${keep({})}`} aria-current={values.category === c.slug ? "true" : undefined} className={`pill ${values.category === c.slug ? "is-on" : ""}`}>{c.name}<span className="num text-[0.7rem] opacity-70">{c.count}</span></Link>
          ))}
        </nav>
      )}
      <form action={action} method="get" className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-start" role="search">
        {values.sort && values.sort !== "new" && <input type="hidden" name="sort" value={values.sort} />}
        {values.view === "list" && <input type="hidden" name="view" value="list" />}
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="f-q">{labels.search}</label>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="f-q" name="q" type="search" defaultValue={values.q} placeholder={labels.search} className="field !ps-9" />
        </div>
        <details className="group relative" open={refined}>
          <summary className="btn btn-outline cursor-pointer list-none !min-h-[2.9rem] w-full [&::-webkit-details-marker]:hidden sm:w-auto"><SlidersHorizontal className="size-4" aria-hidden />{labels.filters}{refined && <span className="size-2 rounded-full bg-brand" aria-hidden />}</summary>
          <div className="z-20 mt-2 w-full space-y-3 border border-ink bg-surface p-4 shadow-[4px_4px_0_var(--ink)] sm:absolute sm:end-0 sm:w-72">
            <div>
              <span className="label">{labels.price}</span>
              <div className="grid grid-cols-2 gap-2">
                <input name="min" inputMode="decimal" placeholder={labels.min} defaultValue={values.min} className="field" aria-label={labels.min} />
                <input name="max" inputMode="decimal" placeholder={labels.max} defaultValue={values.max} className="field" aria-label={labels.max} />
              </div>
            </div>
            <FilterExtras q={values.q} category={values.category} min={values.min} max={values.max} opt={values.opt ?? ""} labels={{ price: labels.price, active: labels.active ?? "Active filters", clearAll: labels.clearAll ?? "Clear all" }} />
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-4 accent-[var(--brand)]" />{labels.stock}</label>
            <a href={action} className="block text-center text-xs font-bold uppercase tracking-wider text-muted underline-offset-4 hover:text-brand hover:underline rtl:tracking-normal">{labels.clear}</a>
          </div>
        </details>
        <button className="btn btn-primary !min-h-[2.9rem]">{labels.apply}</button>
      </form>
    </div>
  );
}
