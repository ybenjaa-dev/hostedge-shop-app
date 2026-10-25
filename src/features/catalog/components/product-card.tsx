import { imgProps } from "@/lib/image-sizes";
import Link from "next/link";
import { Star, Zap } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** White card · mint photo area · goal tag · size line from variants · bold price · green CTA. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank, eyebrow }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number; eyebrow?: string }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const sizes = p.variantNames.slice(0, 2).join(" · ");
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-line bg-surface transition hover:-translate-y-1 hover:shadow-[0_18px_34px_-22px_rgba(12,59,42,.55)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden bg-mint" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={480} height={480} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-700 group-hover:scale-105 ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : <div className="grid size-full place-items-center text-4xl text-muted">◍</div>}
        {discount > 0 && p.inStock && <span className="num tag absolute start-3 top-3">−{discount}%</span>}
        {rank != null && <span className="display num absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-secondary text-sm text-accent">{rank}</span>}
        {!p.inStock && <span className="absolute inset-x-3 bottom-3 rounded-full bg-secondary/90 py-1.5 text-center text-xs font-bold text-white">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {eyebrow && <p className="text-[0.7rem] font-extrabold uppercase tracking-wider text-brand">{eyebrow}</p>}
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[1.02rem] font-bold leading-snug hover:text-brand">{name}</Link>
        {sizes && <p className="truncate text-xs text-muted">{sizes}</p>}
        {p.rating != null && <p className="flex items-center gap-1 text-xs text-muted"><Star className="size-3.5 fill-[#f5b301] text-[#f5b301]" aria-hidden /><span className="num font-bold text-ink">{p.rating}</span>({p.reviewCount})</p>}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1.5">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="text-xl font-extrabold" />
          {p.variantCount > 1 && <span className="text-xs text-muted">+</span>}
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-2 w-full"><Zap className="size-4" aria-hidden />{t("cod.orderNowShort")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[1.5rem] border border-line"><div className="skeleton aspect-square !rounded-none" /><div className="space-y-2 p-3.5"><div className="skeleton h-3 w-1/3" /><div className="skeleton h-4 w-3/4" /><div className="skeleton h-6 w-1/2" /></div></div>
      ))}
    </ProductGrid>
  );
}
