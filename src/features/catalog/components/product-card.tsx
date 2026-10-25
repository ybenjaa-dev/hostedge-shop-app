import Link from "next/link";
import { Star, Zap } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Print-style card: hard border, square photo, price "tag" overlapping the image edge, sticker discount. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  return (
    <article className="group relative flex flex-col border-2 border-ink bg-surface transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ink)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden border-b-2 border-ink bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={480} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-105 ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="hatch grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {rank != null && <span className="display absolute start-0 top-0 grid size-9 place-items-center border-e-2 border-b-2 border-ink bg-accent text-lg text-accent-ink">{rank}</span>}
        {discount > 0 && p.inStock && <span className="sticker absolute end-2 top-2 border-2 border-ink bg-accent px-2 py-0.5 text-xs font-extrabold text-accent-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-0 bottom-0 bg-ink py-1.5 text-center text-xs font-extrabold uppercase tracking-widest text-bg">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.95rem] font-bold leading-tight hover:underline">{name}</Link>
        {p.rating != null && (
          <p className="flex items-center gap-1 text-xs font-semibold text-muted"><Star className="size-3.5 fill-ink text-ink" aria-hidden /><span className="num text-ink">{p.rating}</span>({p.reviewCount})</p>
        )}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="display text-xl font-extrabold" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-sm text-muted line-through" />}
        </p>
        {codMode && p.inStock && (
          <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-1.5 w-full"><Zap className="size-4" aria-hidden />{t("cod.orderNowShort")}</Link>
        )}
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
        <div key={i} className="border-2 border-line"><div className="skeleton aspect-square" /><div className="space-y-2 p-3"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-6 w-1/3" /></div></div>
      ))}
    </ProductGrid>
  );
}
