import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { FilterExtras } from "./filter-extras";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string; view: string; opt?: string };
  categories: { slug: string; name: string; count: number }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; active?: string; clearAll?: string; apply: string; clear: string; search: string };
};

/** Classic left sidebar: category tree with counts, price range, availability. Plain GET forms — no client JS. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const keep = (extra: Record<string, string>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: values.q, min: values.min, max: values.max, stock: values.stock, sort: values.sort === "new" ? "" : values.sort, view: values.view === "grid" ? "" : values.view, ...extra })) if (v) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  const body = (p: string) => (
    <div className="divide-y divide-line">
      {categories.length > 0 && (
        <div className="p-4">
          <h3 className="mb-2 text-sm font-extrabold uppercase tracking-wide">{labels.category}</h3>
          <ul className="space-y-0.5 text-sm">
            <li><Link href={`/shop${keep({})}`} className={`flex justify-between py-1 hover:text-brand hover:underline ${!values.category ? "font-extrabold text-brand" : ""}`}>{labels.all}</Link></li>
            {categories.map((c) => (
              <li key={c.slug}><Link href={`/category/${c.slug}${keep({})}`} className={`flex justify-between py-1 hover:text-brand hover:underline ${values.category === c.slug ? "font-extrabold text-brand" : ""}`}><span>{c.name}</span><span className="num text-muted">({c.count})</span></Link></li>
            ))}
          </ul>
        </div>
      )}
      <form action={action} method="get" className="space-y-4 p-4" id={`${p}search`}>
        {values.sort && values.sort !== "new" && <input type="hidden" name="sort" value={values.sort} />}
        {values.view === "list" && <input type="hidden" name="view" value="list" />}
        <div>
          <label className="label" htmlFor={`${p}q`}>{labels.search}</label>
          <input id={`${p}q`} name="q" type="search" defaultValue={values.q} className="field" />
        </div>
        <div>
          <span className="label">{labels.price}</span>
          <div className="grid grid-cols-2 gap-2">
            <input name="min" inputMode="decimal" placeholder={labels.min} defaultValue={values.min} className="field" aria-label={labels.min} />
            <input name="max" inputMode="decimal" placeholder={labels.max} defaultValue={values.max} className="field" aria-label={labels.max} />
          </div>
        </div>
        <FilterExtras q={values.q} category={values.category} min={values.min} max={values.max} opt={values.opt ?? ""} labels={{ price: labels.price, active: labels.active ?? "Active filters", clearAll: labels.clearAll ?? "Clear all" }} />
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-4 accent-[var(--brand)]" />{labels.stock}</label>
        <div className="flex gap-2"><button className="btn btn-primary flex-1">{labels.apply}</button><a href={action} className="btn btn-outline">{labels.clear}</a></div>
      </form>
    </div>
  );
  return (
    <aside>
      <details className="panel lg:hidden">
        <summary className="bar bar-brand cursor-pointer list-none [&::-webkit-details-marker]:hidden"><span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4" />{labels.filters}</span></summary>
        {body("m-")}
      </details>
      <div className="panel hidden lg:block"><div className="bar"><h2>{labels.filters}</h2></div>{body("d-")}</div>
    </aside>
  );
}
