import Link from "next/link";
import { Star } from "lucide-react";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { imgProps } from "@/lib/image-sizes";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

const Stars = ({ v }: { v: number }) => (
  <span className="flex" aria-hidden>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3 ${i < Math.round(v) ? "fill-accent text-accent" : "text-rule"}`} />)}</span>
);

const discountOf = (p: P) => (p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0);

/** A book standing on the shelf: portrait 2:3 cover, serif title, italic author, price. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const author = tr(p.shortDesc, lang);
  const discount = discountOf(p);
  return (
    <article className="shelf-item cover-lift group">
      <div className="shelf-stand">
        <Link href={`/p/${p.slug}`} className="cover" aria-label={name}>
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} width={400} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={p.inStock ? "" : "opacity-50 grayscale"} />
          ) : <span className="grid size-full place-items-center text-3xl text-muted">❦</span>}
          {!p.inStock && <span className="absolute inset-x-0 bottom-3 z-10 bg-ink/85 py-1 text-center text-[0.65rem] font-bold uppercase tracking-[0.2em] text-bg">{t("p.soldOut")}</span>}
        </Link>
        {discount > 0 && p.inStock && <span className="num absolute -end-2 -top-3 z-10 grid size-11 rotate-6 place-items-center rounded-full bg-accent text-xs font-extrabold text-accent-ink shadow-md">−{discount}%</span>}
      </div>
      <div className="shelf-meta flex flex-1 flex-col">
        <Link href={`/p/${p.slug}`} className="display line-clamp-2 text-[1.08rem] leading-snug hover:text-brand">{name}</Link>
        {author && <p className="italic-serif mt-0.5 line-clamp-1 text-sm text-muted">{t("bk.byline", { name: author })}</p>}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2.5">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="num text-base font-bold" />
          {discount > 0 && <Money amount={p.compareAt!} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
          {p.rating != null && <span className="ms-auto flex items-center gap-1 text-xs text-muted"><Stars v={p.rating} /></span>}
        </div>
        {codMode && p.inStock && <Link href={`/p/${p.slug}?order=1#order`} className="mt-1.5 w-fit text-xs font-bold uppercase tracking-[0.12em] text-brand underline-offset-4 hover:underline rtl:tracking-normal">{t("cod.orderNowShort")} →</Link>}
      </div>
    </article>
  );
}

/** Catalogue entry used by the list view: small cover, title, author, then price. */
export function ProductRow({ p, lang, t, currency, codMode, categoryName }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; categoryName?: string }) {
  const name = tr(p.name, lang);
  const author = tr(p.shortDesc, lang);
  const discount = discountOf(p);
  return (
    <article className="cover-lift grid grid-cols-[5.5rem_1fr] items-start gap-x-5 gap-y-3 border-b border-line py-5 sm:grid-cols-[6.5rem_1fr_11rem]">
      <Link href={`/p/${p.slug}`} className="cover" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.image ? <img {...imgProps(p.image, "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw")} alt={name} loading="lazy" className={p.inStock ? "" : "opacity-50 grayscale"} /> : null}
      </Link>
      <div className="min-w-0">
        {categoryName && <p className="eyebrow">{categoryName}</p>}
        <Link href={`/p/${p.slug}`} className="display mt-0.5 block text-xl hover:text-brand sm:text-2xl">{name}</Link>
        {author && <p className="italic-serif text-muted">{t("bk.byline", { name: author })}</p>}
        <p className={`mt-2 text-xs font-bold uppercase tracking-[0.14em] rtl:tracking-normal ${p.inStock ? "text-ok" : "text-danger"}`}>{p.inStock ? t("p.inStock") : t("p.soldOut")}{p.rating != null && <span className="ms-3 inline-flex items-center gap-1 align-middle font-normal text-muted"><Stars v={p.rating} />({p.reviewCount})</span>}</p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start sm:text-end">
        <p className="flex flex-wrap items-baseline gap-x-2 sm:justify-end">
          <Money amount={p.minPrice} currency={currency} lang={lang} className="num display text-2xl" />
          {discount > 0 && <Money amount={p.compareAt!} currency={currency} lang={lang} className="text-xs text-muted line-through" />}
        </p>
        {codMode && p.inStock ? <Link href={`/p/${p.slug}?order=1#order`} className="btn btn-primary btn-sm">{t("cod.orderNowShort")}</Link> : <Link href={`/p/${p.slug}`} className="btn btn-outline btn-sm">{t("home.shopNow")}</Link>}
      </div>
    </article>
  );
}

export function ProductGrid({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={`shelf ${wide ? "is-wide" : ""}`}>{children}</div>;
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="shelf-item"><div className="skeleton aspect-[2/3]" /><div className="skeleton mt-6 h-5 w-3/4" /><div className="skeleton mt-2 h-4 w-1/2" /></div>
      ))}
    </ProductGrid>
  );
}
