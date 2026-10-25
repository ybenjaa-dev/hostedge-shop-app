import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Gallery card: borderless warm-grey stage, quiet type, hairline-outline button. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const first = parseFacts(tr(p.specs, lang)).find((f) => f.value);
  return (
    <article className="group relative flex flex-col">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-700 group-hover:scale-[1.04] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {discount > 0 && p.inStock && <span className="caps absolute start-0 top-3 bg-[#0b0b0b] px-3 py-1 text-[#e9dcc0]">−{discount}%</span>}
        {!p.inStock && <span className="caps absolute inset-x-0 bottom-0 bg-[#0b0b0b] px-2 py-2 text-center text-[#e9dcc0]">{t("p.soldOut")}</span>}
      </Link>
      <div className="mt-4 flex flex-1 flex-col items-center gap-1 text-center">
        <Link href={`/p/${p.slug}`} className="heading line-clamp-2 text-[1.12rem] leading-tight hover:text-[var(--champagne)]">{name}</Link>
        {first && <p className="line-clamp-1 text-xs text-muted" dir="auto">{first.value}</p>}
        <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 text-sm">
          {p.hasVariants && <span className="caps text-muted">{t("p.from")}</span>}
          <Money amount={p.minPrice} currency={currency} lang={lang} className="font-medium" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {codMode && p.inStock && (
          <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-outline btn-sm mt-3 w-full">{t("cod.orderNowShort")}</Link>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-[4/5] !rounded-none" /><div className="skeleton mx-auto mt-4 h-5 w-3/4" /><div className="skeleton mx-auto mt-2 h-4 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
