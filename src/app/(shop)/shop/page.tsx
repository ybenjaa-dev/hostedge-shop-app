import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { listCategories, listProducts, type ListParams } from "@/features/catalog/queries";
import { ProductCard, ProductGrid, ProductRow } from "@/features/catalog/components/product-card";
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
  const sortKey = params.sort ?? "new";
  return (
    <div className="px-5 pb-6 pt-10 sm:px-10 lg:pt-14">
      <nav aria-label="Breadcrumb" className="micro mb-6">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / <Link href="/shop" className="hover:text-ink">{t("nav.shop")}</Link>{cat && <> / <span className="text-ink">{tr(cat.name, lang)}</span></>}
      </nav>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <h1 className="display text-5xl sm:text-7xl">{cat ? tr(cat.name, lang) : sp.q ? `“${sp.q}”` : t("shop.title")}</h1>
        <p className="micro num pb-2">{t("shop.results", { n: res.total })}</p>
      </header>
      <CatalogFilters
        action={base}
        values={{ q: sp.q ?? "", category: cat?.slug ?? "", min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock ?? "", sort: sortKey, view, opt: sp.opt ?? "" }}
        categories={cats.map((c) => ({ slug: c.slug, name: tr(c.name, lang), count: c.count }))}
        labels={{ filters: t("shop.refine"), category: t("shop.category"), all: t("shop.allCategories"), price: t("shop.price"), min: t("shop.min"), max: t("shop.max"), stock: t("shop.inStock"), active: t("shop.filter.active"), clearAll: t("shop.filter.clearAll"), apply: t("shop.apply"), clear: t("shop.clear"), search: t("shop.searchPh") }}
      />
      <div className="mb-10 mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-line py-3">
        <div className="no-scrollbar flex items-center gap-6 overflow-x-auto">
          <span className="micro">{t("shop.sort")}</span>
          {sorts.map(([k, l]) => <Link key={k} href={`${base}${qs({ sort: k === "new" ? "" : k, page: "" })}`} aria-current={sortKey === k ? "true" : undefined} className="nh-tab">{l}</Link>)}
        </div>
        <div className="flex items-center gap-4">
          <Link href={`${base}${qs({ view: "" })}`} aria-label="Grid" aria-current={view === "grid" ? "true" : undefined} className="nh-tab">{"▦"}</Link>
          <Link href={`${base}${qs({ view: "list" })}`} aria-label="List" aria-current={view === "list" ? "true" : undefined} className="nh-tab">{"☰"}</Link>
        </div>
      </div>
      {res.items.length === 0 ? (
        <div className="grid place-items-center gap-5 py-24 text-center"><p className="display text-3xl">{t("shop.empty")}</p><Link href={base} className="btn btn-outline">{t("shop.clear")}</Link></div>
      ) : view === "list" ? (
        <div>{res.items.map((p) => <ProductRow key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} categoryName={catName(p.categoryId)} />)}</div>
      ) : (
        <ProductGrid>{res.items.map((p, i) => <ProductCard key={p.id} p={p} i={i} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} priority={i < 3} />)}</ProductGrid>
      )}
      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6" aria-label="Pagination">
          <Link aria-disabled={res.page <= 1} href={res.page > 1 ? `${base}${qs({ page: String(res.page - 1) })}` : "#"} className={`micro ulink text-ink ${res.page <= 1 ? "pointer-events-none opacity-30" : ""}`}><span aria-hidden className="inline-block rtl:rotate-180">←</span> {t("shop.prev")}</Link>
          <span className="micro num">{t("shop.page", { p: res.page, n: pages })}</span>
          <Link aria-disabled={res.page >= pages} href={res.page < pages ? `${base}${qs({ page: String(res.page + 1) })}` : "#"} className={`micro ulink text-ink ${res.page >= pages ? "pointer-events-none opacity-30" : ""}`}>{t("shop.next")} <span aria-hidden className="inline-block rtl:rotate-180">→</span></Link>
        </nav>
      )}
    </div>
  );
}
