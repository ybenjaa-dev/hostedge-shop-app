import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Spec-forward card: dark stage for the product shot, up to two key-spec chips, mono price. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const chips = parseFacts(tr(p.specs, lang)).filter((f) => f.value && f.label !== "In the box" && !/^(warranty|garantie|الضمان)$/i.test(f.label)).slice(0, 2);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-brand/60 hover:shadow-[0_18px_40px_-24px_var(--brand)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden bg-[#0b1220]" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image)} alt={name} width={480} height={480} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.05] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {discount > 0 && p.inStock && <span className="mono absolute start-2 top-2 rounded-md bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/80 px-2 py-1.5 text-center text-xs font-bold text-white">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.95rem] font-semibold leading-snug hover:text-brand">{name}</Link>
        {chips.length > 0 && <p className="flex flex-wrap gap-1">{chips.map((c, i) => <span key={i} className="chip-spec max-w-full truncate" dir="auto">{c.value}</span>)}</p>}
        {p.rating != null && (
          <p className="flex items-center gap-1 text-xs text-muted"><Star className="size-3.5 fill-accent text-accent" aria-hidden /> <span className="num">{p.rating}</span> <span>({p.reviewCount})</span></p>
        )}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="mono text-lg font-bold" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-sm text-muted line-through" />}
        </p>
        {codMode && p.inStock && (
          <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-1.5 w-full">{t("cod.orderNowShort")}</Link>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-square rounded-2xl" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
