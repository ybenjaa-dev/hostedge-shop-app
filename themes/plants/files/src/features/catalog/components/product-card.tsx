import Link from "next/link";
import { Star, Plus } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { imgProps } from "@/lib/image-sizes";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";
import { careOf } from "../care";
import { CareChips } from "./care-chips";

const Stars = ({ v }: { v: number }) => (
  <span className="flex" aria-hidden>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < Math.round(v) ? "fill-accent text-ink" : "text-ink/30"}`} />)}</span>
);

/** Sticker-style card: chunky rounded photo with a hard shadow, care chips, price pill and a round "+" order button. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank, big }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number; big?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const care = careOf(p.slug);
  return (
    <article className={`pcard group ${big ? "md:col-span-2 md:row-span-2" : ""}`}>
      <div className={`pcard-img ${big ? "md:aspect-auto md:min-h-[18rem] md:flex-1" : ""}`}>
        <Link href={`/p/${p.slug}`} className="block size-full">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={400} height={400} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition-transform duration-300 group-hover:scale-105 ${p.inStock ? "" : "opacity-50 grayscale"}`} />
          ) : <div className="grid size-full place-items-center text-4xl">🌱</div>}
        </Link>
        <div className="pointer-events-none absolute start-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {discount > 0 && p.inStock && <span className="sticker coral num">−{discount}%</span>}
          {!p.inStock && <span className="sticker !bg-surface">{t("p.soldOut")}</span>}
        </div>
        {rank != null && <span className="display num pointer-events-none absolute end-3 top-1 text-5xl text-white [-webkit-text-stroke:2px_#1f3d2b] [paint-order:stroke_fill]">{rank}</span>}
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} aria-label={`${t("cod.orderNowShort")} — ${name}`} className="pcard-add"><Plus className="size-6" strokeWidth={3} /></Link>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-1">
        <Link href={`/p/${p.slug}`} className={`display line-clamp-2 leading-tight hover:underline hover:decoration-wavy hover:decoration-[var(--coral)] ${big ? "text-xl sm:text-2xl" : "text-[1.05rem]"}`}>{name}</Link>
        {p.rating != null && <div className="flex items-center gap-1.5 text-xs text-muted"><Stars v={p.rating} /><span>({p.reviewCount})</span></div>}
        <CareChips care={care} t={t} />
        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <span className="rounded-full border-2 border-edge bg-sun px-2.5 py-0.5 text-[#1f3d2b]"><Money amount={p.minPrice} currency={currency} lang={lang} className="display text-base" /></span>
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
      </div>
    </article>
  );
}

/** Horizontal row used by the list view of the catalog. */
export function ProductRow({ p, lang, t, currency, codMode, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; categoryName?: string }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="nb grid grid-cols-[6.5rem_1fr] items-center gap-4 p-3 transition hover:-translate-y-0.5 sm:grid-cols-[9rem_1fr_auto]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square self-start overflow-hidden rounded-[1.5rem_1.5rem_1.5rem_.5rem] border-2 border-edge bg-mint" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img {...imgProps(p.image, "(min-width: 640px) 9rem, 6.5rem")} alt={name} loading="lazy" className={`size-full object-cover ${p.inStock ? "" : "opacity-50 grayscale"}`} /> : <span className="grid size-full place-items-center text-3xl">🌱</span>}
        {discount > 0 && p.inStock && <span className="sticker coral num absolute start-1 top-1 !text-[.7rem]">−{discount}%</span>}
      </Link>
      <div className="min-w-0">
        <Link href={`/p/${p.slug}`} className="display text-lg hover:underline">{name}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">{p.rating != null && <><Stars v={p.rating} /><span>({p.reviewCount})</span></>}{categoryName && <span className="chip !py-0 !text-xs">{categoryName}</span>}</div>
        <div className="mt-2"><CareChips care={careOf(p.slug)} t={t} /></div>
        <p className={`mt-2 text-xs font-bold ${p.inStock ? "text-ok" : "text-danger"}`}>{p.inStock ? t("p.inStock") : t("p.soldOut")}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t-2 border-dashed border-edge pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <p className="flex flex-wrap items-baseline gap-x-2 sm:flex-col sm:items-end">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="display text-xl" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {codMode && p.inStock ? <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm">{t("cod.orderNowShort")}</Link> : <Link href={`/p/${p.slug}`} className="btn btn-outline btn-sm">{t("home.shopNow")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children, bento }: { children: React.ReactNode; bento?: boolean }) {
  return <div className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4 ${bento ? "md:[grid-auto-flow:dense]" : ""}`}>{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-square" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-6 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
