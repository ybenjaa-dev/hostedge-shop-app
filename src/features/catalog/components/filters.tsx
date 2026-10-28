import Link from "next/link";

type Props = {
  action: string;
  values: { q: string; category: string; min: string; max: string; stock: string; sort: string; view: string };
  categories: { slug: string; name: string; count: number }[];
  labels: { filters: string; category: string; all: string; price: string; min: string; max: string; stock: string; apply: string; clear: string; search: string };
};

/** Maison filters: category names set in a centred row, price / availability folded into a quiet "Refine" drawer. Plain GET forms — no client JS. */
export function CatalogFilters({ action, values, categories, labels }: Props) {
  const keep = (extra: Record<string, string>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: values.q, min: values.min, max: values.max, stock: values.stock, sort: values.sort === "new" ? "" : values.sort, view: values.view === "grid" ? "" : values.view, ...extra })) if (v) u.set(k, v); const s = u.toString(); return s ? `?${s}` : ""; };
  const active = Boolean(values.min || values.max || values.stock || values.q);
  return (
    <div>
      {categories.length > 0 && (
        <nav aria-label={labels.category} className="flex flex-wrap justify-center gap-x-9 gap-y-4 border-y border-line py-5">
          <Link href={`/shop${keep({})}`} className={`caps lx-link ${!values.category ? "is-on" : ""}`}>{labels.all}</Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}${keep({})}`} className={`caps lx-link ${values.category === c.slug ? "is-on" : ""}`}>{c.name}<sup className="lx-num ms-1.5 text-[0.7rem] tracking-normal text-muted">{c.count}</sup></Link>
          ))}
        </nav>
      )}
      <details className="group/d" open={active}>
        <summary className="caps mx-auto mt-5 flex w-fit cursor-pointer items-center gap-3 text-muted transition-colors hover:text-brand">
          {labels.filters}<span className="block h-px w-6 bg-current transition-all group-open/d:w-10" />
        </summary>
        <form action={action} method="get" className="lx-pop mx-auto mt-6 grid max-w-4xl items-end gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          {values.sort && values.sort !== "new" && <input type="hidden" name="sort" value={values.sort} />}
          {values.view === "list" && <input type="hidden" name="view" value="list" />}
          <div>
            <label className="label" htmlFor="f-q">{labels.search}</label>
            <input id="f-q" name="q" type="search" defaultValue={values.q} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="f-min">{labels.price} · {labels.min}</label>
            <input id="f-min" name="min" inputMode="decimal" defaultValue={values.min} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="f-max">{labels.price} · {labels.max}</label>
            <input id="f-max" name="max" inputMode="decimal" defaultValue={values.max} className="field" />
          </div>
          <label className="flex min-h-[2.9rem] items-center gap-3 text-sm"><input type="checkbox" name="stock" value="1" defaultChecked={values.stock === "1"} className="size-4 accent-[var(--brand)]" />{labels.stock}</label>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-4 lg:justify-center"><button className="btn btn-primary">{labels.apply}</button><a href={action} className="btn btn-outline">{labels.clear}</a></div>
        </form>
      </details>
    </div>
  );
}
