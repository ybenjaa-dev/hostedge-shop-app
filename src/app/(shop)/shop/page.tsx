import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { listCategories, listProducts, type ListParams } from "@/features/catalog/queries";
import { ProductCard, ProductGrid, ProductRow } from "@/features/catalog/components/product-card";
import { LayoutGrid, List } from "lucide-react";
import { toMinor } from "@/lib/money";
import { CatalogFilters } from "@/features/catalog/components/filters";

export const metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <Catalog sp={sp} />;
}

export async function Catalog({ sp, categorySlug }: { sp: Record<string, string | undefined>; categorySlug?: string }) {
  const s = await getSettings();
  const { lang, t } = await getT();
  const cats = await listCategories();
  const cat = cats.find((c) => c.slug === (categorySlug ?? sp.category));
  const min = sp.min ? toMinor(sp.min, s.store.currency) : NaN;
  const max = sp.max ? toMinor(sp.max, s.store.currency) : NaN;
  const sortOk = ["new", "price_asc", "price_desc", "popular"] as const;
  const params: ListParams = {
    q: sp.q?.trim().slice(0, 80) || undefined,
    categoryId: cat?.id,
    minPrice: Number.isFinite(min) ? min : undefined,
    maxPrice: Number.isFinite(max) ? max : undefined,
    inStock: sp.stock === "1",
    sort: sortOk.find((x) => x === sp.sort) ?? "new",
    page: Math.max(1, parseInt(sp.page ?? "1", 10) || 1),
    perPage: 12,
  };
  const res = await listProducts(params);
  const pages = Math.max(1, Math.ceil(res.total / res.perPage));
  const view = sp.view === "list" ? "list" : "grid";
  const base = categorySlug ? `/category/${categorySlug}` : "/shop";
  const qs = (over: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v && !(categorySlug && k === "category")) u.set(k, v);
    const out = u.toString();
    return out ? `?${out}` : "";
  };
  const sorts: [string, string][] = [["new", t("shop.sort.new")], ["popular", t("shop.sort.popular")], ["price_asc", t("shop.sort.price_asc")], ["price_desc", t("shop.sort.price_desc")]];
  const catName = (id: string | null) => { const c = cats.find((x) => x.id === id); return c ? tr(c.name, lang) : undefined; };
  const title = cat ? tr(cat.name, lang) : sp.q ? `“${sp.q}”` : t("shop.title");
  const cur = params.sort ?? "new";
  return (
    <div>
      <header className="relative overflow-hidden border-b border-line bg-surface">
        <p aria-hidden className="display outline-text pointer-events-none absolute -bottom-6 start-0 select-none whitespace-nowrap text-[clamp(6rem,24vw,20rem)] leading-none opacity-40" style={{ ["--stroke" as string]: "var(--rule)" }}>{title}</p>
        <div className="relative mx-auto flex max-w-[90rem] flex-wrap items-end justify-between gap-4 px-4 pb-6 pt-8 sm:px-8 sm:pt-12">
          <div>
            <nav aria-label="Breadcrumb" className="kicker mb-3"><Link href="/" className="hover:underline">{t("nav.home")}</Link> / <Link href="/shop" className="hover:underline">{t("nav.shop")}</Link></nav>
            <h1 className="display text-[clamp(2.75rem,9vw,6.5rem)]">{title}</h1>
          </div>
          <p className="skew lime px-4 py-1.5 text-sm font-black uppercase tracking-wider"><span className="num">{t("shop.results", { n: res.total })}</span></p>
        </div>
      </header>
      <div className="mx-auto max-w-[90rem] space-y-5 px-4 py-5 sm:px-8">
        <CatalogFilters
          action={base}
          values={{ q: sp.q ?? "", category: cat?.slug ?? "", min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock ?? "", sort: cur, view }}
          categories={cats.map((c) => ({ slug: c.slug, name: tr(c.name, lang), count: c.count }))}
          labels={{ filters: t("sp.filtersOpen"), category: t("shop.category"), all: t("sp.all"), price: t("shop.price"), min: t("shop.min"), max: t("shop.max"), stock: t("shop.inStock"), apply: t("shop.apply"), clear: t("shop.clear"), search: t("shop.searchPh") }}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-2 text-sm">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar"><span className="label !mb-0 me-2 shrink-0">{t("sp.sortBy")}</span>
            {sorts.map(([k, l]) => <Link key={k} href={`${base}${qs({ sort: k === "new" ? "" : k, page: "" })}`} aria-current={cur === k ? "true" : undefined} className={`shrink-0 border-b-2 px-2.5 py-1.5 font-bold uppercase tracking-wide ${cur === k ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-muted hover:text-ink"}`}>{l}</Link>)}
          </div>
          <span className="flex">
            <Link href={`${base}${qs({ view: "" })}`} aria-label={t("sp.viewGrid")} aria-current={view === "grid" ? "true" : undefined} className={`grid size-9 place-items-center ${view === "grid" ? "lime" : "bg-sunken hover:text-[var(--brand)]"}`}><LayoutGrid className="size-4" /></Link>
            <Link href={`${base}${qs({ view: "list" })}`} aria-label={t("sp.viewList")} aria-current={view === "list" ? "true" : undefined} className={`grid size-9 place-items-center ${view === "list" ? "lime" : "bg-sunken hover:text-[var(--brand)]"}`}><List className="size-4" /></Link>
          </span>
        </div>
        {res.items.length === 0 ? (
          <div className="grid place-items-center gap-4 bg-surface p-14 text-center"><p className="display text-4xl">{t("shop.empty")}</p><Link href={base} className="btn btn-primary">{t("shop.clear")}</Link></div>
        ) : view === "list" ? (
          <div className="space-y-4">{res.items.map((p) => <ProductRow key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} categoryName={catName(p.categoryId)} />)}</div>
        ) : (
          <ProductGrid>{res.items.map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} priority={i < 4} />)}</ProductGrid>
        )}
        {pages > 1 && (
          <nav className="flex items-center justify-between gap-3 py-2" aria-label="Pagination">
            <Link aria-disabled={res.page <= 1} href={res.page > 1 ? `${base}${qs({ page: String(res.page - 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page <= 1 ? "pointer-events-none opacity-40" : ""}`}>‹ {t("shop.prev")}</Link>
            <span className="display num text-2xl">{t("shop.page", { p: res.page, n: pages })}</span>
            <Link aria-disabled={res.page >= pages} href={res.page < pages ? `${base}${qs({ page: String(res.page + 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page >= pages ? "pointer-events-none opacity-40" : ""}`}>{t("shop.next")} ›</Link>
          </nav>
        )}
      </div>
    </div>
  );
}
