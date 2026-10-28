import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { listCategories, listProducts, type ListParams } from "@/features/catalog/queries";
import { ProductCard, ProductGrid, ProductRow } from "@/features/catalog/components/product-card";
import { LayoutGrid, List } from "lucide-react";
import { toMinor } from "@/lib/money";
import { parseOptions } from "@/lib/shop-filters";
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
    options: parseOptions(sp.opt),
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
  const title = cat ? tr(cat.name, lang) : sp.q ? `“${sp.q}”` : t("bk.browse");
  const sortCls = (k: string) => `border-b pb-0.5 ${(params.sort ?? "new") === k ? "border-brand font-bold text-brand" : "border-transparent text-muted hover:text-ink"}`;
  return (
    <div className="mx-auto max-w-[80rem] px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <nav aria-label="Breadcrumb" className="eyebrow !text-muted">
          <Link href="/" className="hover:text-brand">{t("nav.home")}</Link> / <Link href="/shop" className="hover:text-brand">{t("nav.shop")}</Link>{cat && <> / <span className="text-brand">{tr(cat.name, lang)}</span></>}
        </nav>
        <h1 className="display mt-3 text-4xl sm:text-6xl">{title}</h1>
        <p className="italic-serif mt-2 text-muted"><span className="num">{t("shop.results", { n: res.total })}</span></p>
      </header>
      <CatalogFilters
        action={base}
        values={{ q: sp.q ?? "", category: cat?.slug ?? "", min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock ?? "", sort: params.sort ?? "new", view, opt: sp.opt ?? "" }}
        categories={cats.map((c) => ({ slug: c.slug, name: tr(c.name, lang), count: c.count }))}
        labels={{ filters: t("shop.filters"), category: t("shop.category"), all: t("bk.allGenres"), price: t("shop.price"), min: t("shop.min"), max: t("shop.max"), stock: t("shop.inStock"), active: t("shop.filter.active"), clearAll: t("shop.filter.clearAll"), apply: t("shop.apply"), clear: t("shop.clear"), search: t("bk.searchPh") }}
      />
      <div className="rule-double mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line py-3 text-sm">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1"><span className="eyebrow !text-muted">{t("shop.sort")}</span>
          {sorts.map(([k, l]) => <Link key={k} href={`${base}${qs({ sort: k === "new" ? "" : k, page: "" })}`} aria-current={(params.sort ?? "new") === k ? "true" : undefined} className={sortCls(k)}>{l}</Link>)}
        </span>
        <span className="flex gap-1">
          <Link href={`${base}${qs({ view: "" })}`} aria-label="Shelf" aria-current={view === "grid" ? "true" : undefined} className={`grid size-8 place-items-center rounded-sm border ${view === "grid" ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"}`}><LayoutGrid className="size-4" /></Link>
          <Link href={`${base}${qs({ view: "list" })}`} aria-label="List" aria-current={view === "list" ? "true" : undefined} className={`grid size-8 place-items-center rounded-sm border ${view === "list" ? "border-ink bg-ink text-bg" : "border-line hover:border-ink"}`}><List className="size-4" /></Link>
        </span>
      </div>
      <div className="min-w-0">
        {res.items.length === 0 ? (
          <div className="grid place-items-center gap-4 py-20 text-center"><p className="display text-2xl italic">{t("shop.empty")}</p><Link href={base} className="btn btn-primary">{t("shop.clear")}</Link></div>
        ) : view === "list" ? (
          <div>{res.items.map((p) => <ProductRow key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} categoryName={catName(p.categoryId)} />)}</div>
        ) : (
          <ProductGrid wide>{res.items.map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} priority={i < 4} />)}</ProductGrid>
        )}
        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-4" aria-label="Pagination">
            <Link aria-disabled={res.page <= 1} href={res.page > 1 ? `${base}${qs({ page: String(res.page - 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page <= 1 ? "pointer-events-none opacity-40" : ""}`}>‹ {t("shop.prev")}</Link>
            <span className="italic-serif num text-muted">{t("shop.page", { p: res.page, n: pages })}</span>
            <Link aria-disabled={res.page >= pages} href={res.page < pages ? `${base}${qs({ page: String(res.page + 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page >= pages ? "pointer-events-none opacity-40" : ""}`}>{t("shop.next")} ›</Link>
          </nav>
        )}
      </div>
    </div>
  );
}
