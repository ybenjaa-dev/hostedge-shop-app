import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { splitScent } from "@/lib/scent";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Centred, gallery-style card: soft stage, serif name, family · concentration line, "from" price. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const line = splitScent(parseFacts(tr(p.specs, lang))).rest.slice(0, 2).map((r) => r.value).join(" · ");
  return (
    <article className="group relative flex flex-col text-center">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-700 group-hover:scale-[1.05] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {discount > 0 && p.inStock && <span className="eyebrow absolute start-2 top-2 bg-[var(--panel)] px-2 py-1">−{discount}%</span>}
        {!p.inStock && <span className="eyebrow absolute inset-x-0 bottom-0 bg-[var(--panel)] px-2 py-2">{t("p.soldOut")}</span>}
      </Link>
      <div className="mt-4 flex flex-1 flex-col items-center gap-1">
        <Link href={`/p/${p.slug}`} className="heading line-clamp-2 text-[1.2rem] leading-tight hover:text-brand">{name}</Link>
        {line && <p className="line-clamp-1 text-xs italic text-muted" dir="auto">{line}</p>}
        <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 text-sm">
          {p.hasVariants && <span className="text-xs text-muted">{t("p.from")}</span>}
          <Money amount={p.minPrice} currency={currency} lang={lang} className="font-semibold" />
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
        <div key={i}><div className="skeleton aspect-[4/5]" /><div className="skeleton mx-auto mt-4 h-5 w-3/4" /><div className="skeleton mx-auto mt-2 h-4 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
