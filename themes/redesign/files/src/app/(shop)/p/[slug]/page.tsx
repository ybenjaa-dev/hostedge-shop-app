import { RichText } from "@/components/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { toMajorString } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { getProduct, listBundles, listCities, listProducts, listReviews, listCategories } from "@/features/catalog/queries";
import { Gallery } from "@/features/catalog/components/gallery";
import { ProductBuy } from "@/features/checkout/components/product-buy";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { ReviewForm } from "@/features/catalog/components/review-form";
import { ViewContent } from "@/features/catalog/components/view-content";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ order?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  const { lang } = await getT();
  const title = tr(p.seoTitle, lang) || tr(p.name, lang);
  const desc = tr(p.seoDesc, lang) || tr(p.shortDesc, lang);
  const img = p.images[0] ? fileUrl(p.images[0].key) : undefined;
  return { title, description: desc, openGraph: { title, description: desc, images: img ? [img] : undefined, type: "website" } };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const p = await getProduct(slug);
  if (!p) notFound();
  const s = await getSettings();
  const { lang, t } = await getT();
  const [bundles, cities, reviews, related, cats] = await Promise.all([
    listBundles(p.id),
    listCities(s.store.country),
    listReviews({ productId: p.id, limit: 10 }),
    listProducts({ categoryId: p.categoryId ?? undefined, excludeId: p.id, perPage: 4, inStock: true }),
    listCategories(),
  ]);
  const cat = cats.find((c) => c.id === p.categoryId);
  const name = tr(p.name, lang);
  const inStock = !p.trackStock || (p.variants.length ? p.variants.some((v) => v.stock > 0) : p.stock > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: tr(p.shortDesc, lang),
    sku: p.sku ?? undefined,
    image: p.images.map((i) => fileUrl(i.key)),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: s.store.currency,
      lowPrice: toMajorString(Math.min(p.price, ...p.variants.map((v) => v.price)), s.store.currency),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      offerCount: Math.max(1, p.variants.length),
    },
    ...(p.reviewCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } } : {}),
  };

  const wa = s.store.whatsapp ? whatsappLink(s.store.whatsapp, `${name} — ${s.store.name}`) : null;
  const acc = "group border-2 border-ink bg-surface [&+&]:-mt-0.5";
  const sum = "flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-extrabold uppercase tracking-wide [&::-webkit-details-marker]:hidden";
  return (
    <article className="mx-auto max-w-7xl px-4 py-4 pb-28 md:py-8 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={s.store.currency} />
      <nav aria-label="Breadcrumb" className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link> / </>}<span className="text-ink">{name}</span>
      </nav>
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="md:sticky md:top-28 md:self-start"><Gallery images={p.images} alt={name} closeLabel={t("cod.close")} /></div>
        <div>
          <h1 className="display text-[clamp(2.2rem,6vw,3.6rem)] font-extrabold uppercase">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold">
            {p.rating != null ? <span className="inline-flex items-center gap-1"><Star className="size-4 fill-ink text-ink" /><span className="num">{p.rating}</span><span className="font-medium text-muted">({p.reviewCount})</span></span> : <span className="text-muted">{t("p.noReviews")}</span>}
            <span className={`border-2 border-ink px-2 py-0.5 text-xs uppercase ${inStock ? "bg-accent text-accent-ink" : "bg-ink text-bg"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 text-lg leading-relaxed">{tr(p.shortDesc, lang)}</p>
          <div className="mt-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <div className="mt-8">
            {tr(p.longDesc, lang) && (
              <details className={acc} open><summary className={sum}>{t("p.description")}<span aria-hidden className="text-2xl leading-none group-open:hidden">+</span><span aria-hidden className="hidden text-2xl leading-none group-open:block">−</span></summary><RichText html={tr(p.longDesc, lang)} className="prose-lite border-t-2 border-ink px-4 py-4 text-muted" /></details>
            )}
            <details className={acc}><summary className={sum}>{t("p.delivery")}<span aria-hidden className="text-2xl leading-none group-open:hidden">+</span><span aria-hidden className="hidden text-2xl leading-none group-open:block">−</span></summary><div className="border-t-2 border-ink px-4 py-4 text-muted"><p>{t("p.deliveryText")}</p>{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-3">{t("p.shareWa")}</a>}</div></details>
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-8 md:grid-cols-[1fr_22rem]" aria-labelledby="reviews-h">
        <div>
          <h2 id="reviews-h" className="display mb-5 border-b-2 border-ink pb-3 text-3xl font-extrabold uppercase">{t("p.reviews", { n: p.reviewCount })}</h2>
          {reviews.length === 0 ? <p className="text-muted">{t("p.noReviews")}</p> : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="border-2 border-ink bg-surface p-4 shadow-[4px_4px_0_var(--ink)]">
                  <div className="flex items-center justify-between gap-2"><span className="font-extrabold uppercase">{r.name}{r.city && <span className="font-medium normal-case text-muted"> · {r.city}</span>}</span><span className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-ink text-ink" : "text-line"}`} />)}</span></div>
                  <p className="mt-2 leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-5"><h3 className="display mb-3 text-xl font-extrabold uppercase">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-16">
          <h2 className="display mb-5 border-b-2 border-ink pb-3 text-3xl font-extrabold uppercase">{t("p.related")}</h2>
          <ProductGrid>{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} />)}</ProductGrid>
        </section>
      )}
    </article>
  );
}
