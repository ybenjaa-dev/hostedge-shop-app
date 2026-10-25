import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { swatchColor } from "@/lib/swatch";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Variants are named "Size / Color": derive the distinct sizes and colours to hint at availability. */
function parseVariants(names: string[]) {
  const sizes: string[] = [], colors: string[] = [];
  for (const n of names) { const [a, b] = n.split(" / "); if (a && !sizes.includes(a)) sizes.push(a); if (b && !colors.includes(b)) colors.push(b); }
  return { sizes, colors };
}

export function ProductCard({ p, lang, t, currency, codMode, priority, rank }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean; rank?: number; eyebrow?: string }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const { sizes, colors } = parseVariants(p.variantNames);
  return (
    <article className="group relative">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={640} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.04] ${p.inStock ? "" : "opacity-45 grayscale"}`} />
        ) : <div className="grid size-full place-items-center text-muted">—</div>}
        {discount > 0 && p.inStock && <span className="label-s num absolute start-2 top-2 bg-ink px-2 py-1 text-bg">−{discount}%</span>}
        {rank != null && <span className="display num absolute end-2 top-2 text-3xl text-ink/80">{String(rank).padStart(2, "0")}</span>}
        {!p.inStock && <span className="label-s absolute inset-x-0 bottom-0 bg-ink py-1.5 text-center text-bg">{t("p.soldOut")}</span>}
        {p.inStock && sizes.length > 1 && (
          <span className="label-s absolute inset-x-0 bottom-0 flex translate-y-full justify-center gap-3 bg-bg/95 py-2.5 text-[0.65rem] transition duration-300 group-hover:translate-y-0 max-md:hidden">{sizes.slice(0, 6).map((z) => <span key={z}>{z}</span>)}</span>
        )}
      </Link>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/p/${p.slug}`} className="label-s line-clamp-2 !leading-snug hover:underline underline-offset-4">{name}</Link>
          <p className="shrink-0 text-end text-sm"><Money amount={p.minPrice} currency={currency} lang={lang} className="font-semibold" />{p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="block text-xs text-muted line-through" />}</p>
        </div>
        {colors.length > 0 && <p className="mt-2 flex items-center gap-1.5">{colors.slice(0, 5).map((c) => <span key={c} className="dot" style={{ background: swatchColor(c) }} title={c} />)}{colors.length > 5 && <span className="label-s text-muted">+{colors.length - 5}</span>}</p>}
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-outline btn-sm mt-3 w-full md:hidden">{t("cod.orderNowShort")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return <ProductGrid>{Array.from({ length: n }).map((_, i) => <div key={i}><div className="skeleton aspect-[3/4]" /><div className="skeleton mt-3 h-3 w-3/4" /><div className="skeleton mt-2 h-3 w-1/3" /></div>)}</ProductGrid>;
}
