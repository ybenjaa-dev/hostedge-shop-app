import { SlidersHorizontal } from "lucide-react";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string };
  categories: { slug: string; name: string }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; apply: string; clear: string; sort: string; search: string; sorts: Record<string, string> };
};

/** Plain GET form: zero client JS, works on the slowest phones. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const form = (p: string) => (
    <form action={action} method="get" className="space-y-5" id={`${p}search`}>
      <div>
        <label className="label" htmlFor={`${p}f-q`}>{labels.search}</label>
        <input id={`${p}f-q`} name="q" type="search" defaultValue={values.q} className="field" enterKeyHint="search" />
      </div>
      <div>
        <label className="label" htmlFor={`${p}f-sort`}>{labels.sort}</label>
        <select id={`${p}f-sort`} name="sort" defaultValue={values.sort} className="field">
          {Object.entries(labels.sorts).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {categories.length > 0 && (
        <div>
          <label className="label" htmlFor={`${p}f-cat`}>{labels.category}</label>
          <select id={`${p}f-cat`} name="category" defaultValue={values.category} className="field">
            <option value="">{labels.all}</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <span className="label">{labels.price}</span>
        <div className="grid grid-cols-2 gap-2">
          <input name="min" inputMode="decimal" placeholder={labels.min} defaultValue={values.min} className="field" aria-label={labels.min} />
          <input name="max" inputMode="decimal" placeholder={labels.max} defaultValue={values.max} className="field" aria-label={labels.max} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-5 accent-[var(--brand)]" />{labels.stock}</label>
      <div className="flex gap-2">
        <button className="btn btn-primary flex-1">{labels.apply}</button>
        <a href={action} className="btn btn-outline">{labels.clear}</a>
      </div>
    </form>
  );
  return (
    <aside>
      <details className="lg:hidden [&[open]>summary]:mb-4">
        <summary className="btn btn-outline w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden"><SlidersHorizontal className="size-4" /> {labels.filters}</summary>
        {form("m-")}
      </details>
      <div className="sticky top-24 hidden lg:block">{form("d-")}</div>
    </aside>
  );
}
