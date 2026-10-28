import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { listCategories, listProducts, type ListParams } from "@/features/catalog/queries";
import { ProductCard, ProductGrid, ProductRow } from "@/features/catalog/components/product-card";
import { LayoutGrid, List } from "lucide-react";
import { toMinor } from "@/lib/money";
import { Sprig, Squiggle, Monstera } from "@/components/botanical";
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
  const pill = (on: boolean) => `chip ${on ? "is-on" : ""}`;
  return (
    <div className="mx-auto max-w-[78rem] px-4 pb-8 pt-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Link href="/" className="chip !py-0">{t("nav.home")}</Link><span aria-hidden>/</span><Link href="/shop" className="chip !py-0">{t("nav.shop")}</Link>{cat && <><span aria-hidden>/</span><span className="chip is-on !py-0">{tr(cat.name, lang)}</span></>}
      </nav>
      <div className="relative mb-8">
        <Sprig className="pointer-events-none absolute -top-3 end-2 hidden w-14 rotate-12 text-[#4fa86b] sm:block" />
        <h1 className="display text-4xl sm:text-6xl"><span className="relative inline-block">{title}<Squiggle className="absolute inset-x-0 -bottom-2 h-2.5 text-coral" /></span></h1>
        <p className="num mt-4 text-muted">{t("shop.found", { n: res.total })}</p>
      </div>
      <CatalogFilters
        action={base}
        values={{ q: sp.q ?? "", category: cat?.slug ?? "", min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock ?? "", sort: params.sort ?? "new", view }}
        categories={cats.map((c) => ({ slug: c.slug, name: tr(c.name, lang), count: c.count }))}
        labels={{ filters: t("shop.filters"), category: t("shop.category"), all: t("shop.allCategories"), price: t("shop.price"), min: t("shop.min"), max: t("shop.max"), stock: t("shop.inStock"), apply: t("shop.apply"), clear: t("shop.clear"), search: t("shop.searchPh") }}
      />
      <div className="my-6 flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto" role="group" aria-label={t("shop.sort")}>
          <span className="text-sm font-semibold text-muted">{t("shop.sort")}</span>
          {sorts.map(([k, l]) => <Link key={k} href={`${base}${qs({ sort: k === "new" ? "" : k, page: "" })}`} aria-current={(params.sort ?? "new") === k ? "true" : undefined} className={`${pill((params.sort ?? "new") === k)} shrink-0`}>{l}</Link>)}
        </div>
        <span className="nb-pill flex overflow-hidden !shadow-[2px_2px_0_var(--edge)]">
          <Link href={`${base}${qs({ view: "" })}`} aria-label="Grid" aria-current={view === "grid" ? "true" : undefined} className={`grid size-10 place-items-center ${view === "grid" ? "bg-brand text-brand-ink" : "hover:bg-sun hover:text-[#1f3d2b]"}`}><LayoutGrid className="size-4" /></Link>
          <Link href={`${base}${qs({ view: "list" })}`} aria-label="List" aria-current={view === "list" ? "true" : undefined} className={`grid size-10 place-items-center border-s-2 border-edge ${view === "list" ? "bg-brand text-brand-ink" : "hover:bg-sun hover:text-[#1f3d2b]"}`}><List className="size-4" /></Link>
        </span>
      </div>
      {res.items.length === 0 ? (
        <div className="nb grid place-items-center gap-4 p-12 text-center"><Monstera className="w-24 text-[#4fa86b]" /><p className="display text-2xl">{t("shop.empty")}</p><Link href={base} className="btn btn-primary">{t("shop.clear")}</Link></div>
      ) : view === "list" ? (
        <div className="space-y-4">{res.items.map((p) => <ProductRow key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} categoryName={catName(p.categoryId)} />)}</div>
      ) : (
        <ProductGrid>{res.items.map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} priority={i < 4} />)}</ProductGrid>
      )}
      {pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
          <Link aria-disabled={res.page <= 1} href={res.page > 1 ? `${base}${qs({ page: String(res.page - 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page <= 1 ? "pointer-events-none opacity-40" : ""}`}>‹ {t("shop.prev")}</Link>
          <span className="num sticker !rotate-0">{t("shop.page", { p: res.page, n: pages })}</span>
          <Link aria-disabled={res.page >= pages} href={res.page < pages ? `${base}${qs({ page: String(res.page + 1) })}` : "#"} className={`btn btn-outline btn-sm ${res.page >= pages ? "pointer-events-none opacity-40" : ""}`}>{t("shop.next")} ›</Link>
        </nav>
      )}
    </div>
  );
}
