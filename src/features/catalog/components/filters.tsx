import Link from "next/link";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string; view: string };
  categories: { slug: string; name: string; count: number }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; apply: string; clear: string; search: string };
};

/** Category tabs + a quiet "Refine" disclosure (search, price, availability). Plain GET forms — no client JS. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const keep = (extra: Record<string, string>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: values.q, min: values.min, max: values.max, stock: values.stock, sort: values.sort === "new" ? "" : values.sort, view: values.view === "grid" ? "" : values.view, ...extra })) if (v) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  const active = !!(values.q || values.min || values.max || values.stock);
  return (
    <div className="space-y-5">
      <nav className="no-scrollbar -mx-5 flex gap-7 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={labels.category}>
        <Link href={`/shop${keep({})}`} className="nh-tab" aria-current={!values.category ? "true" : undefined}>{labels.all}</Link>
        {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}${keep({})}`} className="nh-tab" aria-current={values.category === c.slug ? "true" : undefined}>{c.name} <span className="num opacity-60">{c.count}</span></Link>)}
      </nav>
      <details className="nh-acc !border-t-0" open={active}>
        <summary className="!justify-start gap-3 !py-1 text-muted hover:text-ink"><span>{labels.filters}</span></summary>
        <form action={action} method="get" className="grid gap-x-8 gap-y-5 pt-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_auto_auto]">
          {values.sort && values.sort !== "new" && <input type="hidden" name="sort" value={values.sort} />}
          {values.view === "list" && <input type="hidden" name="view" value="list" />}
          <div>
            <label className="label" htmlFor="f-q">{labels.search}</label>
            <input id="f-q" name="q" type="search" defaultValue={values.q} className="field" />
          </div>
          <div>
            <span className="label">{labels.price}</span>
            <div className="grid grid-cols-2 gap-4">
              <input name="min" inputMode="decimal" placeholder={labels.min} defaultValue={values.min} className="field" aria-label={labels.min} />
              <input name="max" inputMode="decimal" placeholder={labels.max} defaultValue={values.max} className="field" aria-label={labels.max} />
            </div>
          </div>
          <label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-4 accent-[var(--brand)]" />{labels.stock}</label>
          <div className="flex items-end gap-2"><button className="btn btn-primary btn-sm">{labels.apply}</button><a href={action} className="btn btn-ghost btn-sm">{labels.clear}</a></div>
        </form>
      </details>
    </div>
  );
}
