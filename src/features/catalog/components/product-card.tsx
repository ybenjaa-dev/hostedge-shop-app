import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Rotating picture ratios give the lookbook its uneven, magazine rhythm. */
const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[5/6]", "aspect-[4/5]", "aspect-[5/6]", "aspect-square"] as const;

/** Lookbook tile: a big picture, a tiny caption underneath. No box, no border. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank, i = 0, fixed }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number; i?: number; fixed?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="nh-fig group relative">
      <Link href={`/p/${p.slug}`} className={`nh-img ${fixed ? "aspect-[4/5]" : RATIOS[i % RATIOS.length]}`} aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={800} height={1000} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`absolute inset-0 size-full object-cover ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : <span className="absolute inset-0 grid place-items-center text-3xl text-muted">▢</span>}
        {rank != null && <span className="display num absolute start-3 top-2 text-4xl text-ink/70">{String(rank).padStart(2, "0")}</span>}
        {!p.inStock ? <span className="micro absolute bottom-3 start-3 bg-bg px-2 py-1 text-ink">{t("p.soldOut")}</span> : discount > 0 && <span className="micro num absolute bottom-3 start-3 bg-bg px-2 py-1 !text-brand">−{discount}%</span>}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4 text-[0.88rem] leading-snug">
        <Link href={`/p/${p.slug}`} className="min-w-0 hover:text-brand">{name}</Link>
        <p className="flex shrink-0 flex-col items-end">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="num" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
      </div>
      {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="micro ulink mt-1.5 inline-block hover:!text-brand">{t("cod.orderNowShort")} <span aria-hidden className="inline-block rtl:rotate-180">→</span></Link>}
    </article>
  );
}

/** Horizontal row used by the list view of the catalog. */
export function ProductRow({ p, lang, t, currency, codMode, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; categoryName?: string }) {
  const name = tr(p.name, lang);
  return (
    <article className="nh-fig grid grid-cols-[6.5rem_1fr_auto] items-center gap-5 border-t border-line py-4 first:border-t-0 sm:grid-cols-[9rem_1fr_auto]">
      <Link href={`/p/${p.slug}`} className="nh-img aspect-[4/5]" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img src={fileUrl(p.image, "md")} alt={name} loading="lazy" className={`absolute inset-0 size-full object-cover ${p.inStock ? "" : "opacity-50 grayscale"}`} /> : null}
      </Link>
      <div className="min-w-0">
        {categoryName && <p className="micro mb-1">{categoryName}</p>}
        <Link href={`/p/${p.slug}`} className="display text-2xl hover:text-brand">{name}</Link>
        <p className="mt-1 text-sm text-muted">{p.inStock ? t("p.inStock") : t("p.soldOut")}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <Money amount={p.minPrice} currency={currency} lang={lang} className="num" />
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="micro ulink">{t("cod.orderNowShort")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="nh-masonry">{children}</div>;
}

export function ProductGridSkeleton({ n = 6 }: { n?: number }) {
  const h = ["aspect-[4/5]", "aspect-square", "aspect-[5/6]"];
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className={`skeleton ${h[i % 3]}`} /><div className="skeleton mt-3 h-4 w-3/4" /></div>
      ))}
    </ProductGrid>
  );
}
