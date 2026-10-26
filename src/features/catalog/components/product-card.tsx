import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { imgProps } from "@/lib/image-sizes";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="group relative flex flex-col">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sunken">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.04] ${p.inStock ? "" : "opacity-60 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {discount > 0 && p.inStock && <span className="absolute start-2 top-2 rounded-full bg-accent px-2.5 py-1 text-xs font-extrabold text-accent-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-ink/85 px-2 py-1.5 text-center text-xs font-bold text-bg">{t("p.soldOut")}</span>}
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.95rem] font-semibold leading-snug hover:text-brand">{name}</Link>
        {p.rating != null && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Star className="size-3.5 fill-accent text-accent" aria-hidden /> <span className="num">{p.rating}</span> <span>({p.reviewCount})</span>
          </p>
        )}
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="text-lg font-extrabold" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-sm text-muted line-through" />}
        </p>
        {codMode && p.inStock && (
          <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-2 w-full">{t("cod.orderNowShort")}</Link>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-[4/5] rounded-2xl" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
