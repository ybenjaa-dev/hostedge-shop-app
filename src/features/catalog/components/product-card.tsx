import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const pad = (n: number) => String(n).padStart(2, "0");

function Photo({ p, name, priority, className = "aspect-[4/5]" }: { p: P; name: string; priority?: boolean; className?: string }) {
  return (
    <span className={`lx-spot block ${className}`}>
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fileUrl(p.image, "md")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover ${p.inStock ? "" : "opacity-40 grayscale"}`} />
      ) : <span className="grid size-full place-items-center text-3xl text-muted">◇</span>}
    </span>
  );
}

/** Borderless catalogue card: spotlit photo, serif name, quiet price, gold hairline on hover. */
export function ProductCard({ p, lang, t, currency, priority, rank }: { p: P; lang: Lang; t: TFn; currency: string; codMode?: boolean; priority?: boolean; rank?: number }) {
  const name = tr(p.name, lang);
  return (
    <article className="group">
      <Link href={`/p/${p.slug}`} aria-label={name} className="block">
        <Photo p={p} name={name} priority={priority} />
        <span className="mt-5 flex items-baseline justify-between gap-4">
          <span className="display text-xl leading-tight md:text-2xl">{rank != null && <span className="lx-num me-2 text-sm text-brand">{ROMAN[rank - 1] ?? rank}</span>}{name}</span>
        </span>
        <span className="mt-1.5 flex flex-wrap items-baseline gap-x-3 text-sm text-muted">
          {p.inStock ? <Money amount={p.minPrice} currency={currency} lang={lang} className="lx-num text-base text-ink" /> : <span className="caps text-[0.62rem]">{t("p.soldOut")}</span>}
          {p.inStock && p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-xs line-through" />}
        </span>
      </Link>
    </article>
  );
}

/** Editorial row used on the home page: one piece per row, alternating sides, large type. */
export function ProductFeature({ p, lang, t, currency, index, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; index: number; categoryName?: string }) {
  const name = tr(p.name, lang);
  const flip = index % 2 === 1;
  return (
    <article className="group lx-reveal grid items-center gap-8 md:grid-cols-2 md:gap-20 lg:gap-32">
      <Link href={`/p/${p.slug}`} aria-label={name} className={`block ${flip ? "md:order-2" : ""}`}>
        <Photo p={p} name={name} priority={index === 0} className="aspect-[4/5] md:aspect-[5/6]" />
      </Link>
      <div className={`${flip ? "md:order-1" : ""} md:max-w-md ${flip ? "md:ms-auto" : ""}`}>
        <p className="eyebrow flex items-center gap-4"><span className="lx-num text-base tracking-normal">N° {pad(index + 1)}</span><span className="h-px w-10 bg-[var(--rule)]" />{categoryName}</p>
        <h3 className="display mt-6 text-5xl md:text-6xl"><Link href={`/p/${p.slug}`}>{name}</Link></h3>
        <p className="mt-5 leading-8 text-muted">{tr(p.shortDesc, lang)}</p>
        <p className="mt-6 flex items-baseline gap-4">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="lx-num text-3xl" />
          {p.compareAt && p.compareAt > p.price && <Money amount={p.compareAt} currency={currency} lang={lang} className="text-sm text-muted line-through" />}
        </p>
        <Link href={`/p/${p.slug}`} className="caps lx-link mt-10 inline-flex items-center gap-3">{t("lux.discover")}<ArrowRight className="lx-arrow size-4" strokeWidth={1.3} aria-hidden /></Link>
      </div>
    </article>
  );
}

/** Horizontal row used by the list view of the catalog. */
export function ProductRow({ p, lang, t, currency, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; codMode?: boolean; categoryName?: string }) {
  const name = tr(p.name, lang);
  return (
    <article className="group grid grid-cols-[6.5rem_1fr] items-center gap-6 py-6 sm:grid-cols-[9rem_1fr_auto] sm:gap-10">
      <Link href={`/p/${p.slug}`} aria-label={name} className="block"><Photo p={p} name={name} /></Link>
      <div className="min-w-0">
        {categoryName && <p className="eyebrow">{categoryName}</p>}
        <Link href={`/p/${p.slug}`} className="display mt-2 block text-2xl md:text-3xl">{name}</Link>
        <p className="mt-2 line-clamp-2 hidden text-muted sm:block">{tr(p.shortDesc, lang)}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-6 sm:col-span-1 sm:flex-col sm:items-end">
        {p.inStock ? <Money amount={p.minPrice} currency={currency} lang={lang} className="lx-num text-2xl" /> : <span className="caps text-[0.62rem] text-muted">{t("p.soldOut")}</span>}
        <Link href={`/p/${p.slug}`} className="caps lx-link inline-flex items-center gap-2">{t("lux.discover")}<ArrowRight className="lx-arrow size-4" strokeWidth={1.3} aria-hidden /></Link>
      </div>
    </article>
  );
}

export function ProductGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-2 md:gap-x-16 md:gap-y-24 xl:grid-cols-3 md:[&>*:nth-child(2n)]:mt-20 xl:[&>*:nth-child(2n)]:mt-0 xl:[&>*:nth-child(3n+2)]:mt-24">{children}</div>;
}

export function ProductGridSkeleton({ n = 6 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i}><div className="skeleton aspect-[4/5]" /><div className="skeleton mt-5 h-6 w-3/4" /><div className="skeleton mt-2 h-4 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
