import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { imgProps } from "@/lib/image-sizes";
import { swatchColor, looksLikeShades } from "@/lib/swatch";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Portrait photo with a soft radius, serif title, shade dots, quiet price line. */
export function ProductCard({ p, lang, t, currency, codMode, priority, rank, eyebrow }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number; eyebrow?: string }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const shades = looksLikeShades(p.variantNames) ? p.variantNames : [];
  return (
    <article className="group relative flex flex-col">
      <div className="relative">
        <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-sunken" aria-label={name}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.05] ${p.inStock ? "" : "opacity-55 grayscale"}`} />
          ) : (
            <div className="grid size-full place-items-center text-4xl text-muted">✿</div>
          )}
          {!p.inStock && <span className="absolute inset-x-4 bottom-4 rounded-full bg-ink/85 py-1.5 text-center text-xs font-semibold tracking-wide text-bg">{t("p.soldOut")}</span>}
        </Link>
        {discount > 0 && p.inStock && <span className="num absolute start-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-bold text-brand shadow-sm">−{discount}%</span>}
        {rank != null && <span className="display num absolute end-3 top-3 grid size-8 place-items-center rounded-full bg-surface/95 text-base text-brand shadow-sm">{rank}</span>}
        {codMode && p.inStock && (
          <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm absolute inset-x-3 bottom-3 translate-y-2 opacity-100 shadow-lg transition max-md:hidden md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">{t("cod.orderNowShort")}</Link>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 pt-3.5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Link href={`/p/${p.slug}`} className="display line-clamp-2 text-[1.2rem] leading-tight hover:text-brand">{name}</Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Money amount={p.minPrice} currency={currency} lang={lang} className="font-bold text-brand" />
            {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
          </p>
          {p.rating != null && <span className="flex items-center gap-1 text-xs text-muted"><Star className="size-3.5 fill-rose text-rose" aria-hidden /><span className="num font-semibold text-ink">{p.rating}</span></span>}
        </div>
        {shades.length > 0 ? (
          <p className="flex items-center gap-1 pt-0.5">{shades.slice(0, 5).map((n) => <span key={n} className="swatch" style={{ background: swatchColor(n) }} title={n} />)}{p.variantCount > 5 && <span className="ms-0.5 text-xs text-muted">+{p.variantCount - 5}</span>}<span className="ms-1 text-xs text-muted">{t("p.shades", { n: p.variantCount })}</span></p>
        ) : null}
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-outline btn-sm mt-2 w-full md:hidden">{t("cod.orderNowShort")}</Link>}
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
        <div key={i}><div className="skeleton aspect-[4/5] !rounded-[1.75rem]" /><div className="skeleton mt-3 h-3 w-1/3" /><div className="skeleton mt-2 h-5 w-3/4" /></div>
      ))}
    </ProductGrid>
  );
}
