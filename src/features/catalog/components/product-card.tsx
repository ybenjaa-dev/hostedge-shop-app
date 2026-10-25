import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { splitFood } from "@/lib/foodfacts";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Sticker card: packshot with an origin tag, weight line, diet tags, big price. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const f = splitFood(parseFacts(tr(p.specs, lang)));
  return (
    <article className="sticker group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ink)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-square overflow-hidden border-b-2 border-ink bg-sunken" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={480} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.04] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {f.origin && <span className="tag absolute start-2 top-2" dir="auto">{f.origin}</span>}
        {discount > 0 && p.inStock && <span className="absolute end-2 top-2 grid size-12 rotate-12 place-items-center rounded-full border-2 border-ink bg-accent text-sm font-black text-accent-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-2 bottom-2 border-2 border-ink bg-bg px-2 py-1 text-center text-xs font-extrabold">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.98rem] font-extrabold leading-snug hover:underline">{name}</Link>
        <p className="text-xs font-semibold text-muted" dir="auto">{f.weight}{f.diet.length > 0 && ` · ${f.diet.slice(0, 2).join(" · ")}`}</p>
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          {p.hasVariants && <span className="text-xs font-bold text-muted">{t("p.from")}</span>}
          <Money amount={p.minPrice} currency={currency} lang={lang} className="heading text-xl" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-sm text-muted line-through" />}
        </p>
        {codMode && p.inStock && (
          <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm mt-1 w-full">{t("cod.orderNowShort")}</Link>
        )}
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 pe-1.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
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
