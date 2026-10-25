import Link from "next/link";
import type { ProductCard as P } from "../queries";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { parseFacts } from "@/lib/facts";
import { fitList } from "@/lib/fitment";
import { Money } from "@/components/money";
import type { TFn } from "@/lib/dict";

/** Garage card: dark picture panel with a fitment chip (Universal / Fits N models), spec line, red price action. */
export function ProductCard({ p, lang, t, currency, codMode, priority }: { p: P; lang: Lang; t: TFn; currency: string; codMode: boolean; priority?: boolean }) {
  const name = tr(p.name, lang);
  const discount = p.compareAt && p.compareAt > p.price ? Math.round(((p.compareAt - p.price) / p.compareAt) * 100) : 0;
  const facts = parseFacts(tr(p.specs, lang)).filter((f) => f.value);
  const compat = facts.find((f) => /^(compatibility|compatibilité|التوافق)$/i.test(f.label));
  const n = fitList(compat?.value).length;
  const spec = facts.find((f) => f !== compat);
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-[var(--brand)] hover:shadow-[0_16px_34px_-22px_var(--brand)]">
      <Link href={`/p/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-[#12161c]" aria-label={name}>
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(p.image, "md")} alt={name} width={480} height={600} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`size-full object-cover transition duration-500 group-hover:scale-[1.04] ${p.inStock ? "" : "opacity-50 grayscale"}`} />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-muted">▢</div>
        )}
        {compat && <span className="chip absolute start-2 top-2" dir="auto">{n > 0 ? t("p.fitsN", { n }) : t("p.universal")}</span>}
        {discount > 0 && p.inStock && <span className="absolute end-2 top-2 rounded-md bg-brand px-2 py-0.5 text-xs font-extrabold text-brand-ink">−{discount}%</span>}
        {!p.inStock && <span className="absolute inset-x-2 bottom-2 rounded-md bg-black/85 px-2 py-1.5 text-center text-xs font-bold text-white">{t("p.soldOut")}</span>}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/p/${p.slug}`} className="line-clamp-2 text-[0.95rem] font-bold leading-snug hover:text-brand">{name}</Link>
        {spec && <p className="line-clamp-1 text-xs text-muted" dir="auto">{spec.value}</p>}
        <p className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
          {p.hasVariants && <span className="text-xs font-semibold text-muted">{t("p.from")}</span>}
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
        <div key={i}><div className="skeleton aspect-[4/5] rounded-xl" /><div className="skeleton mt-3 h-4 w-3/4" /><div className="skeleton mt-2 h-5 w-1/3" /></div>
      ))}
    </ProductGrid>
  );
}
