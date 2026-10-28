import Link from "next/link";
import { Star, Check } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Tall dark tile: image stage, slanted price tag, NEW / −% stickers, optional outlined rank numeral. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank, big }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number; big?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className={`tile group ${big ? "sm:col-span-2 sm:row-span-2" : ""}`}>
      <Link href={`/p/${p.slug}`} className={`tile-media ${big ? "sm:!aspect-auto sm:flex-1" : ""}`} aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={400} height={500} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover ${p.inStock ? "" : "opacity-40 grayscale"}`} />
        ) : <div className="grid size-full place-items-center text-3xl text-muted">▢</div>}
        {p.inStock && p.featured && <span className="sticker start-3 top-3 bg-[var(--brand)] text-black">{t("sp.new")}</span>}
        {discount > 0 && p.inStock && <span className={`sticker num start-3 bg-white text-black ${p.featured ? "top-10" : "top-3"}`}>−{discount}%</span>}
        {rank != null && <span className="display outline-text pointer-events-none absolute end-3 top-1 text-6xl" style={{ ["--stroke" as string]: "#fff" }}>{rank}</span>}
        {!p.inStock && <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-6 bg-black/85 py-1 text-center text-sm font-black uppercase tracking-widest text-white">{t("p.soldOut")}</span>}
        <span className="price-tag"><Money amount={p.minPrice} currency={currency} lang={lang} /></span>
      </Link>
      <div className="flex flex-col gap-1 p-3 pt-3.5">
        <Link href={`/p/${p.slug}`} className={`display line-clamp-2 transition-colors group-hover:text-[var(--brand)] ${big ? "text-3xl" : "min-h-[2.2em] text-xl"}`}>{name}</Link>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="flex items-center gap-1">{p.rating != null ? <><Star className="size-3.5 fill-[var(--brand)] text-[var(--brand)]" aria-hidden /><b className="num text-ink">{p.rating}</b><span>({p.reviewCount})</span></> : <span>&nbsp;</span>}</span>
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="line-through" />}
        </div>
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-outline btn-sm mt-2 w-full group-hover:!bg-[var(--brand)] group-hover:!text-black">{t("cod.orderNowShort")}</Link>}
      </div>
    </article>
  );
}

/** Horizontal row used by the list view of the catalog. */
export function ProductRow({ p, lang, t, currency, codMode, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; categoryName?: string }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="tile group grid grid-cols-[7.5rem_1fr] sm:grid-cols-[11rem_1fr_14rem]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square self-stretch overflow-hidden bg-sunken sm:aspect-auto" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img src={fileUrl(p.image, "md")} alt={name} loading="lazy" className={`size-full object-cover ${p.inStock ? "" : "opacity-40 grayscale"}`} /> : <span className="grid size-full place-items-center text-muted">▢</span>}
        {discount > 0 && p.inStock && <span className="sticker num start-2 top-2 bg-white text-black">−{discount}%</span>}
      </Link>
      <div className="min-w-0 p-3">
        {categoryName && <p className="kicker mb-1">{categoryName}</p>}
        <Link href={`/p/${p.slug}`} className="display block text-2xl transition-colors group-hover:text-[var(--brand)]">{name}</Link>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">{p.rating != null && <><Star className="size-3.5 fill-[var(--brand)] text-[var(--brand)]" aria-hidden /><b className="num text-ink">{p.rating}</b><span>({p.reviewCount})</span></>}</div>
        <p className={`mt-1.5 flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${p.inStock ? "text-ok" : "text-danger"}`}>{p.inStock ? <><Check className="size-3.5" />{t("p.inStock")}</> : t("p.soldOut")}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-line p-3 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-center sm:border-s sm:border-t-0">
        <p className="flex flex-wrap items-baseline gap-x-2 sm:block">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="display block text-3xl text-[var(--brand)]" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {codMode && p.inStock ? <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm">{t("cod.orderNowShort")}</Link> : <Link href={`/p/${p.slug}`} className="btn btn-outline btn-sm">{t("home.shopNow")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children, bento }: { children: React.ReactNode; bento?: boolean }) {
  return <div className={`grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 ${bento ? "sm:[grid-auto-flow:dense]" : ""}`}>{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="bg-surface p-0"><div className="skeleton aspect-[4/5]" /><div className="skeleton m-3 h-6 w-3/4" /><div className="skeleton m-3 h-4 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
