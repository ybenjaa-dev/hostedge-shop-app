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
import { parseFacts } from "@/lib/facts";
import { getProduct, listBundles, listCities, listProducts, listReviews, listCategories } from "@/features/catalog/queries";
import { Gallery } from "@/features/catalog/components/gallery";
import { ProductBuy } from "@/features/checkout/components/product-buy";
import { ProductCard } from "@/features/catalog/components/product-card";
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
  return { title, description: desc, openGraph: { title, description: desc, images: img ? [img] : undefined, type: "website" }, alternates: { canonical: `/p/${p.slug}` } };
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
  const facts = parseFacts(tr(p.specs, lang));
  const isSize = (l: string) => /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d{2})$/i.test(l.trim());
  const sizeRows = facts.filter((f) => isSize(f.label) && f.value).map((f) => ({ size: f.label, cells: f.value.split("·").map((c) => { const m = c.trim().match(/^(\D*?)\s*(\d.*)$/); return m ? { h: m[1]!.trim(), v: m[2]!.trim() } : { h: "", v: c.trim() }; }) }));
  const careRows = facts.filter((f) => !isSize(f.label));
  const acc = "group border-b border-line";
  const sum = "label-s flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden";
  const plus = <><span aria-hidden className="text-lg group-open:hidden">+</span><span aria-hidden className="hidden text-lg group-open:block">−</span></>;
  return (
    <article className="mx-auto max-w-[88rem] px-4 py-4 pb-28 md:px-6 md:py-8 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={s.store.currency} />
      <nav aria-label="Breadcrumb" className="label-s mb-5 text-muted"><Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link> / </>}<span className="text-ink">{name}</span></nav>
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr] lg:gap-14">
        <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        <div className="md:sticky md:top-28 md:self-start">
          <h1 className="display text-[clamp(2.2rem,5vw,3.6rem)]">{name}</h1>
          <p className="label-s mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
            {p.rating != null && <span className="text-ink">★ <span className="num">{p.rating}</span> ({p.reviewCount})</span>}
            {p.sku && <span>SKU {p.sku}</span>}
            <span className={inStock ? "text-ink" : "text-danger"}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          <div className="mt-6">
            <ProductBuy autoOpen={sp.order === "1"} product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }} bundles={bundles} cities={cities} />
          </div>
          <p className="label-s mt-4 border-y border-line py-3 text-center">{t("p.freeExchange")}</p>
          <div className="mt-2">
            {sizeRows.length > 0 && (
              <details className={acc}><summary className={sum}>{t("p.sizeGuide")}{plus}</summary>
                <div className="overflow-x-auto pb-5"><table className="size-table"><thead><tr><th />{sizeRows[0]!.cells.map((c, i) => <th key={i} className="label-s text-muted">{c.h}</th>)}</tr></thead><tbody>{sizeRows.map((r) => <tr key={r.size}><th>{r.size}</th>{r.cells.map((c, i) => <td key={i}>{c.v}</td>)}</tr>)}</tbody></table></div>
              </details>
            )}
            <details className={acc} open><summary className={sum}>{t("p.composition")}{plus}</summary>
              <div className="pb-5 text-sm text-muted"><p className="prose-lite">{tr(p.longDesc, lang)}</p>{careRows.length > 0 && <dl className="mt-3 space-y-1">{careRows.map((f, i) => <div key={i} className="flex gap-2"><dt className="font-semibold text-ink">{f.label}:</dt><dd>{f.value}</dd></div>)}</dl>}</div>
            </details>
            <details className={acc}><summary className={sum}>{t("p.delivery")}{plus}</summary><div className="pb-5 text-sm text-muted"><p>{t("p.deliveryText")}</p>{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-3">{t("p.shareWa")}</a>}</div></details>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-10 border-t border-ink pt-8 md:grid-cols-[1fr_22rem]" aria-labelledby="reviews-h">
        <div>
          <h2 id="reviews-h" className="display mb-6 text-3xl sm:text-5xl">{t("p.reviews", { n: p.reviewCount })}</h2>
          {reviews.length === 0 ? <p className="text-muted">{t("p.noReviews")}</p> : (
            <ul className="divide-y divide-line border-y border-line">{reviews.map((r) => <li key={r.id} className="py-5"><p className="label-s flex flex-wrap gap-x-3">{r.name}{r.city && <span className="text-muted">{r.city}</span>}<span>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></span></p><p className="mt-2 leading-relaxed">{r.body}</p></li>)}</ul>
          )}
        </div>
        <div className="h-fit border border-ink p-5"><h3 className="label-s mb-4">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-20"><h2 className="display mb-8 text-3xl sm:text-5xl">{t("p.related")}</h2><div className="rail">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} />)}</div></section>
      )}
    </article>
  );
}
