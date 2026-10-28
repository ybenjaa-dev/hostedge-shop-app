import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { listCategories, listProducts, type ListParams } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
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
  const qs = (over: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...over })) if (v && !(categorySlug && k === "category")) u.set(k, v);
    return `?${u.toString()}`;
  };
  const base = categorySlug ? `/category/${categorySlug}` : "/shop";
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <h1 className="display text-[clamp(2.4rem,8vw,5rem)] font-extrabold uppercase">{cat ? tr(cat.name, lang) : sp.q ? `“${sp.q}”` : t("shop.title")}</h1>
        <p className="num border-2 border-ink px-3 py-1 text-sm font-extrabold uppercase">{t("shop.results", { n: res.total })}</p>
      </div>
      {cats.length > 0 && (
        <nav aria-label={t("shop.category")} className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          <Link href="/shop" aria-current={!cat ? "page" : undefined} className={`whitespace-nowrap border-2 border-ink px-4 py-2 text-sm font-extrabold uppercase ${!cat ? "bg-ink text-bg" : "bg-surface hover:bg-sunken"}`}>{t("shop.all")}</Link>
          {cats.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} aria-current={cat?.id === c.id ? "page" : undefined} className={`whitespace-nowrap border-2 border-ink px-4 py-2 text-sm font-extrabold uppercase ${cat?.id === c.id ? "bg-brand text-brand-ink" : "bg-surface hover:bg-sunken"}`}>{tr(c.name, lang)}</Link>
          ))}
        </nav>
      )}
      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <CatalogFilters
          action={base}
          values={{ q: sp.q ?? "", category: cat?.slug ?? "", min: sp.min ?? "", max: sp.max ?? "", stock: sp.stock ?? "", sort: params.sort ?? "new", opt: sp.opt ?? "" }}
          categories={categorySlug ? [] : cats.map((c) => ({ slug: c.slug, name: tr(c.name, lang) }))}
          labels={{ filters: t("shop.filters"), category: t("shop.category"), all: t("shop.allCategories"), price: t("shop.price"), min: t("shop.min"), max: t("shop.max"), stock: t("shop.inStock"), active: t("shop.filter.active"), clearAll: t("shop.filter.clearAll"), apply: t("shop.apply"), clear: t("shop.clear"), sort: t("shop.sort"), search: t("shop.searchPh"), sorts: { new: t("shop.sort.new"), price_asc: t("shop.sort.price_asc"), price_desc: t("shop.sort.price_desc"), popular: t("shop.sort.popular") } }}
        />
        <div>
          {res.items.length === 0 ? (
            <div className="grid place-items-center gap-3 border-2 border-dashed border-ink p-12 text-center">
              <p className="text-lg font-semibold">{t("shop.empty")}</p>
              <Link href={base} className="btn btn-primary">{t("shop.clear")}</Link>
            </div>
          ) : (
            <ProductGrid>{res.items.map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} priority={i < 4} />)}</ProductGrid>
          )}
          {pages > 1 && (
            <nav className="mt-10 flex items-center justify-between gap-3" aria-label="Pagination">
              <Link aria-disabled={res.page <= 1} href={res.page > 1 ? `${base}${qs({ page: String(res.page - 1) })}` : "#"} className={`btn btn-outline ${res.page <= 1 ? "pointer-events-none opacity-40" : ""}`}>{t("shop.prev")}</Link>
              <span className="num text-sm text-muted">{t("shop.page", { p: res.page, n: pages })}</span>
              <Link aria-disabled={res.page >= pages} href={res.page < pages ? `${base}${qs({ page: String(res.page + 1) })}` : "#"} className={`btn btn-outline ${res.page >= pages ? "pointer-events-none opacity-40" : ""}`}>{t("shop.next")}</Link>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
