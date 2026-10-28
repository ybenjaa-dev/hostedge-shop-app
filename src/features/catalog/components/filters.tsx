import Link from "next/link";
import { SlidersHorizontal, Search } from "lucide-react";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string; view: string };
  categories: { slug: string; name: string; count: number }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; apply: string; clear: string; search: string };
};

/** Top filter strip: category chips, a pill search, and a collapsible price / stock tray. Plain GET forms — no client JS. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const keep = (extra: Record<string, string>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: values.q, min: values.min, max: values.max, stock: values.stock, sort: values.sort === "new" ? "" : values.sort, view: values.view === "grid" ? "" : values.view, ...extra })) if (v) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  const trayOpen = !!(values.min || values.max || values.stock);
  return (
    <aside className="space-y-4">
      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={`/shop${keep({})}`} aria-current={!values.category ? "true" : undefined} className="chip shrink-0 !py-1.5 !text-base">{labels.all}</Link>
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}${keep({})}`} aria-current={values.category === c.slug ? "true" : undefined} className="chip shrink-0 !py-1.5 !text-base">{c.name}<span className="num rounded-full bg-ink/10 px-1.5 text-xs">{c.count}</span></Link>
        ))}
      </div>
      <form action={action} method="get" className="nb p-3 sm:p-4">
        {values.sort && values.sort !== "new" && <input type="hidden" name="sort" value={values.sort} />}
        {values.view === "list" && <input type="hidden" name="view" value="list" />}
        <div className="group/t">
          <input type="checkbox" id="f-tray" defaultChecked={trayOpen} className="peer sr-only" aria-label={labels.filters} />
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor="f-q">{labels.search}</label>
              <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input id="f-q" name="q" type="search" defaultValue={values.q} placeholder={labels.search} className="field !rounded-full !ps-10" />
            </div>
            <label htmlFor="f-tray" className="btn btn-outline cursor-pointer select-none group-has-[#f-tray:checked]/t:!bg-sun group-has-[#f-tray:checked]/t:!text-[#1f3d2b] group-has-[#f-tray:focus-visible]/t:outline group-has-[#f-tray:focus-visible]/t:outline-[3px] group-has-[#f-tray:focus-visible]/t:outline-offset-2 group-has-[#f-tray:focus-visible]/t:outline-[var(--coral)]"><SlidersHorizontal className="size-4" aria-hidden /><span className="hidden sm:inline">{labels.filters}</span></label>
            <button className="btn btn-primary">{labels.apply}</button>
          </div>
          <div className="mt-4 hidden flex-wrap items-end gap-4 peer-checked:flex border-t-2 border-dashed border-edge pt-4">
            <div>
              <span className="label">{labels.price}</span>
              <div className="flex gap-2">
                <input name="min" inputMode="decimal" placeholder={labels.min} defaultValue={values.min} className="field !w-28" aria-label={labels.min} />
                <input name="max" inputMode="decimal" placeholder={labels.max} defaultValue={values.max} className="field !w-28" aria-label={labels.max} />
              </div>
            </div>
            <label className="chip cursor-pointer !py-2"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-4 accent-[var(--brand)]" />{labels.stock}</label>
            <a href={action} className="btn btn-ghost btn-sm">{labels.clear}</a>
          </div>
        </div>
      </form>
    </aside>
  );
}
