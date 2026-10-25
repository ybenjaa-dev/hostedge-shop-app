import Link from "next/link";
import { Star, Check } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

const Stars = ({ v }: { v: number }) => (
  <span className="flex" aria-hidden>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < Math.round(v) ? "fill-accent text-accent" : "text-rule"}`} />)}</span>
);

/** Dense catalog card: white tile, thin border, contained photo, stars, bold price, full-width CTA. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="group relative flex flex-col border border-line bg-surface transition hover:z-10 hover:border-ink hover:shadow-md">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden bg-white" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image)} alt={name} width={400} height={400} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : <div className="grid size-full place-items-center bg-sunken text-3xl text-muted">▢</div>}
        {discount > 0 && p.inStock && <span className="num absolute start-0 top-2 bg-danger px-2 py-0.5 text-xs font-extrabold text-white">−{discount}%</span>}
        {rank != null && <span className="num absolute end-0 top-0 bg-secondary px-2 py-0.5 text-xs font-extrabold text-white">#{rank}</span>}
        {!p.inStock && <span className="absolute inset-x-0 bottom-0 bg-secondary/90 py-1 text-center text-xs font-bold uppercase text-white">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-2.5">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 min-h-[2.5rem] text-[0.92rem] font-medium leading-snug hover:text-brand hover:underline">{name}</Link>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          {p.rating != null ? <><Stars v={p.rating} /><span>({p.reviewCount})</span></> : <span>&nbsp;</span>}
        </div>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="text-lg font-extrabold" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {p.inStock && <p className="flex items-center gap-1 text-xs font-semibold text-ok"><Check className="size-3.5" />{t("p.inStock")}</p>}
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-1.5 w-full">{t("cod.orderNowShort")}</Link>}
      </div>
    </article>
  );
}

/** Horizontal row used by the list view of the catalog. */
export function ProductRow({ p, lang, t, currency, codMode, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; categoryName?: string }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="grid grid-cols-[7.5rem_1fr] gap-3 border border-line bg-surface p-3 hover:border-ink sm:grid-cols-[10rem_1fr_13rem]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square self-start overflow-hidden bg-white" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img src={fileUrl(p.image)} alt={name} loading="lazy" className={`size-full object-cover ${p.inStock ? "" : "opacity-50 grayscale"}`} /> : <span className="grid size-full place-items-center bg-sunken text-muted">▢</span>}
        {discount > 0 && p.inStock && <span className="num absolute start-0 top-1 bg-danger px-1.5 py-0.5 text-xs font-extrabold text-white">−{discount}%</span>}
      </Link>
      <div className="min-w-0">
        <Link href={`/p/${p.slug}`} className="text-base font-bold hover:text-brand hover:underline">{name}</Link>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">{p.rating != null ? <><Stars v={p.rating} /><span>({p.reviewCount})</span></> : null}{categoryName && <span>· {categoryName}</span>}</div>
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-bold ${p.inStock ? "text-ok" : "text-danger"}`}>{p.inStock ? <><Check className="size-3.5" />{t("p.inStock")}</> : t("p.soldOut")}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-line pt-2 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-center sm:border-s sm:border-t-0 sm:ps-3 sm:pt-0">
        <p className="flex flex-wrap items-baseline gap-x-2 sm:block">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="block text-xl font-extrabold" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {codMode && p.inStock ? <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm">{t("cod.orderNowShort")}</Link> : <Link href={`/p/${p.slug}`} className="btn btn-outline btn-sm">{t("home.shopNow")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-3 xl:grid-cols-4 [&>*]:border-0">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-surface p-2.5"><div className="skeleton aspect-square" /><div className="skeleton mt-2 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
