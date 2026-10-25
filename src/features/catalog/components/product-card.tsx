import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { splitHome } from "@/lib/homefacts";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Soft rounded card: tinted stage, material · size line, price and a pill button. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const h = splitHome(parseFacts(tr(p.specs, lang)));
  const line = [h.material, h.dimensions].filter(Boolean).join(" · ");
  return (
    <article className="group relative flex flex-col">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image)} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.04] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {discount > 0 && p.inStock && <span className="absolute start-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-brand-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-3 bottom-3 rounded-full bg-ink/85 px-3 py-1.5 text-center text-xs font-bold text-bg">{t("p.soldOut")}</span>}
      </Link>
      <div className="mt-3 flex flex-1 flex-col gap-1 px-1">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.98rem] font-semibold leading-snug hover:text-brand">{name}</Link>
        {line && <p className="line-clamp-1 text-xs text-muted" dir="auto">{line}</p>}
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          {p.hasVariants && <span className="text-xs text-muted">{t("p.from")}</span>}
          <Money amount={p.minPrice} currency={currency} lang={lang} className="text-lg font-bold" />
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
  return <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-[4/5] rounded-[1.75rem]" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
