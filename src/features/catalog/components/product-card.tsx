import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { splitKids } from "@/lib/kidsfacts";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Friendly card: padded white tile, round-cornered picture with an age bubble, candy button. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const k = splitKids(parseFacts(tr(p.specs, lang)));
  return (
    <article className="soft group relative flex flex-col rounded-[2rem] bg-surface p-2.5 transition hover:-translate-y-1">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-[1.5rem] bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image)} alt={name} width={480} height={480} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.05] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {k.age && <span className="bubble absolute start-2 top-2" dir="auto">{k.age}</span>}
        {discount > 0 && p.inStock && <span className="absolute end-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-extrabold text-brand-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/85 px-3 py-1 text-center text-xs font-bold text-bg">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1 pt-3">
        <Link href={`/p/${p.slug}`} className="heading line-clamp-2 text-[1.05rem] leading-tight hover:text-brand">{name}</Link>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          {p.hasVariants && <span className="text-xs font-semibold text-muted">{t("p.from")}</span>}
          <Money amount={p.minPrice} currency={currency} lang={lang} className="heading text-xl" />
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
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-square rounded-[2rem]" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
