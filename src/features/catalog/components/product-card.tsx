import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { imgProps } from "@/lib/image-sizes";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Mihrab-arch photo window, centered serif title, gold price, double-border CTA. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="group relative flex flex-col text-center">
      <Link href={`/p/${p.slug}`} className="frame arch relative block aspect-[4/5] overflow-hidden bg-sunken p-[6px]" aria-label={name}>
        <span className="arch block size-full overflow-hidden bg-sunken">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-700 group-hover:scale-105 ${p.inStock ? "" : "opacity-50 grayscale"}`} />
          ) : (
            <span className="bg-zel grid size-full place-items-center text-3xl text-gold">✦</span>
          )}
        </span>
        {!p.inStock && <span className="absolute inset-x-6 bottom-4 rounded-full bg-navy py-1 text-xs font-bold text-[#f6efd9]">{t("p.soldOut")}</span>}
      </Link>
      {discount > 0 && p.inStock && (
        <span className="num absolute end-1 top-[42%] z-10 grid size-12 -rotate-6 place-items-center bg-gold text-[0.8rem] font-extrabold text-navy [clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]" aria-label={`-${discount}%`}>−{discount}%</span>
      )}
      {rank != null && <span className="heading num absolute start-1 top-[42%] z-10 grid size-9 place-items-center rounded-full border border-gold bg-surface text-lg text-gold-ink">{rank}</span>}
      <div className="flex flex-1 flex-col items-center gap-1 px-1 pt-3">
        <Link href={`/p/${p.slug}`} className="heading line-clamp-2 text-[1.12rem] leading-snug hover:text-brand">{name}</Link>
        {p.rating != null && (
          <p className="flex items-center gap-1 text-xs text-muted"><Star className="size-3.5 fill-gold text-gold" aria-hidden /><span className="num font-bold text-ink">{p.rating}</span>({p.reviewCount})</p>
        )}
        <p className="mt-auto flex flex-wrap items-baseline justify-center gap-x-2 pt-1">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="heading text-xl font-bold text-gold-ink" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-sm text-muted line-through" />}
        </p>
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-2 w-full">{t("cod.orderNowShort")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="text-center"><div className="skeleton arch aspect-[4/5]" /><div className="skeleton mx-auto mt-3 h-4 w-3/4" /><div className="skeleton mx-auto mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
