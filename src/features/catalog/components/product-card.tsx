import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { swatchColor } from "@/lib/swatch";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Angular card: cut top-right corner, colour dots from the variants, skewed price tag. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const colors = [...new Set(p.variantNames.map((n) => n.split(" / ")[0]!.trim()))].slice(0, 5);
  return (
    <article className="cut group relative flex flex-col bg-surface transition hover:-translate-y-1">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.05] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {discount > 0 && p.inStock && <span className="tag absolute start-0 top-3"><span>−{discount}%</span></span>}
        {!p.inStock && <span className="heading absolute inset-x-0 bottom-0 bg-[#0d0d0d] px-2 py-1.5 text-center text-sm text-[var(--lime)]">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.95rem] font-bold leading-snug hover:underline">{name}</Link>
        {colors.length > 0 && <p className="flex items-center gap-1" aria-label={t("p.colours")}>{colors.map((c) => <span key={c} title={c} className="size-3.5 rounded-full border border-ink/25" style={{ background: swatchColor(c) }} />)}</p>}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          {p.hasVariants && <span className="text-xs font-semibold uppercase text-muted rtl:normal-case">{t("p.from")}</span>}
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
        <div key={i}><div className="skeleton aspect-[4/5] !rounded-none" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
