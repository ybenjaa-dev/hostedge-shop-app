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
  return (
    <div className="mx-auto max-w-[84rem] px-3 py-3">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-brand hover:underline">{t("nav.home")}</Link> › <Link href="/shop" className="hover:text-brand hover:underline">{t("nav.shop")}</Link>{cat && <> › <span className="font-bold text-ink">{tr(cat.name, lang)}</span></>}
      </nav>
      <div className="grid gap-3 lg:grid-cols-[15.5rem_1fr]">
        <CatalogFilters
          action={base}
          values={{ q: sp.q ?? "", category: cat?.slug ?? "", min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock ?? "", sort: params.sort ?? "new", view, opt: sp.opt ?? "" }}
          categories={cats.map((c) => ({ slug: c.slug, name: tr(c.name, lang), count: c.count }))}
          labels={{ filters: t("shop.filters"), category: t("shop.category"), all: t("shop.allCategories"), price: t("shop.price"), min: t("shop.min"), max: t("shop.max"), stock: t("shop.inStock"), active: t("shop.filter.active"), clearAll: t("shop.filter.clearAll"), apply: t("shop.apply"), clear: t("shop.clear"), search: t("shop.searchPh") }}
        />
        <div className="min-w-0">
          <div className="panel mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2">
            <h1 className="text-lg font-extrabold">{cat ? tr(cat.name, lang) : sp.q ? `“${sp.q}”` : t("shop.title")} <span className="num text-sm font-normal text-muted">— {t("shop.results", { n: res.total })}</span></h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex flex-wrap items-center gap-1"><span className="text-muted">{t("shop.sort")}:</span>
                {sorts.map(([k, l]) => <Link key={k} href={`${base}${qs({ sort: k === "new" ? "" : k, page: "" })}`} aria-current={(params.sort ?? "new") === k ? "true" : undefined} className={`border px-2 py-1 ${(params.sort ?? "new") === k ? "border-brand bg-brand-soft font-bold text-brand" : "border-line hover:border-ink"}`}>{l}</Link>)}
              </span>
              <span className="flex border border-line">
                <Link href={`${base}${qs({ view: "" })}`} aria-label="Grid" aria-current={view === "grid" ? "true" : undefined} className={`grid size-8 place-items-center ${view === "grid" ? "bg-secondary text-white" : "hover:bg-sunken"}`}><LayoutGrid className="size-4" /></Link>
                <Link href={`${base}${qs({ view: "list" })}`} aria-label="List" aria-current={view === "list" ? "true" : undefined} className={`grid size-8 place-items-center border-s border-line ${view === "list" ? "bg-secondary text-white" : "hover:bg-sunken"}`}><List className="size-4" /></Link>
              </span>
            </div>
          </div>
          {res.items.length === 0 ? (
            <div className="panel grid place-items-center gap-3 p-12 text-center"><p className="text-lg font-bold">{t("shop.empty")}</p><Link href={base} className="btn btn-primary">{t("shop.clear")}</Link></div>
          ) : view === "list" ? (
            <div className="space-y-2">{res.items.map((p) => <ProductRow key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} categoryName={catName(p.categoryId)} />)}</div>
          ) : (
            <ProductGrid>{res.items.map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} priority={i < 4} />)}</ProductGrid>
          )}
          {pages > 1 && (
            <nav className="panel mt-3 flex items-center justify-between gap-3 px-3 py-2" aria-label="Pagination">
              <Link aria-disabled={res.page <= 1} href={res.page > 1 ? `${base}${qs({ page: String(res.page - 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page <= 1 ? "pointer-events-none opacity-40" : ""}`}>‹ {t("shop.prev")}</Link>
              <span className="num text-sm text-muted">{t("shop.page", { p: res.page, n: pages })}</span>
              <Link aria-disabled={res.page >= pages} href={res.page < pages ? `${base}${qs({ page: String(res.page + 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page >= pages ? "pointer-events-none opacity-40" : ""}`}>{t("shop.next")} ›</Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
