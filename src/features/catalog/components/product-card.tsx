import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { imgProps } from "@/lib/image-sizes";
import { parseFacts } from "@/lib/facts";
import { splitPet } from "@/lib/petfacts";
import { petIcon } from "@/lib/goal-icon";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Friendly card: rounded picture with pet icons for who it suits, a stage · size line and a dog-tag price. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const f = splitPet(parseFacts(tr(p.specs, lang)));
  const line = [f.stage, f.size].filter(Boolean).join(" · ");
  return (
    <article className="group relative flex flex-col rounded-[1.75rem] border-2 border-line bg-surface p-2.5 transition hover:-translate-y-1 hover:border-[var(--paw)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden rounded-[1.25rem] bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={480} height={480} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.05] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {f.suitable.length > 0 && <span className="absolute start-2 top-2 flex gap-1">{f.suitable.slice(0, 2).map((x) => { const I = petIcon(x); return <span key={x} title={x} className="grid size-8 place-items-center rounded-full bg-white/95 text-brand shadow"><I className="size-4.5" /></span>; })}</span>}
        {discount > 0 && p.inStock && <span className="absolute end-2 top-2 rounded-full bg-[var(--paw)] px-2.5 py-0.5 text-xs font-extrabold text-[#2b1608]">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/85 px-3 py-1 text-center text-xs font-bold text-bg">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1 pt-3">
        <Link href={`/p/${p.slug}`} className="heading line-clamp-2 text-[1.02rem] leading-tight hover:text-brand">{name}</Link>
        {line && <p className="line-clamp-1 text-xs text-muted" dir="auto">{line}</p>}
        <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2">
          <span className="petag text-sm">{p.hasVariants && <span className="text-xs font-semibold opacity-85">{t("p.from")}</span>}<Money amount={p.minPrice} currency={currency} lang={lang} /></span>
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
        <div key={i}><div className="skeleton aspect-square rounded-[1.75rem]" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
