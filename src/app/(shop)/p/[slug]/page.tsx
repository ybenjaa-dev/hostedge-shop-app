import { RichText } from "@/components/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { toMajorString, formatMoney } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { Banknote, Truck } from "lucide-react";
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
  const cur = s.store.currency;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const maxC = Math.max(1, ...dist.map((d) => d.c));
  const parts = (tr(p.longDesc, lang) || tr(p.shortDesc, lang)).split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  const specRows = parts.length > 1 ? parts[parts.length - 1]!.split("\n").map((l) => l.match(/^([^:]{2,30}):\s*(.+)$/)) : [];
  const hasSpecs = specRows.length > 0 && specRows.every(Boolean);
  const desc = hasSpecs ? parts.slice(0, -1) : parts;
  const stars = (n: number, size = "size-3.5") => Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`${size} ${i < n ? "fill-brand text-brand" : "text-rule"}`} strokeWidth={1.4} />);
  return (
    <article className="pb-28 lg:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={cur} />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_27rem] xl:grid-cols-[minmax(0,1fr)_31rem]">
        <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        <div className="px-5 py-8 sm:px-10 lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:overflow-y-auto lg:py-12">
          <nav aria-label="Breadcrumb" className="micro">
            <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / <Link href="/shop" className="hover:text-ink">{t("nav.shop")}</Link>{cat && <> / <Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link></>}
          </nav>
          <h1 className="display mt-6 text-5xl sm:text-6xl">{name}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {p.rating != null ? <a href="#reviews" className="inline-flex items-center gap-2 text-muted hover:text-ink"><span className="flex">{stars(Math.round(p.rating))}</span><span className="num">{p.rating} · {t("p.reviews", { n: p.reviewCount })}</span></a> : <span className="text-muted">{t("p.noReviews")}</span>}
            <span className={`micro ${inStock ? "!text-ok" : "!text-danger"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-5 leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          <div className="mt-8">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>

          <div className="mt-10">
            <details className="nh-acc" open>
              <summary>{t("p.description")}</summary>
              <RichText html={desc.join("\n\n")} className="prose-lite text-sm text-muted" />
            </details>
            <details className="nh-acc">
              <summary>{t("p.dimensions")}</summary>
              <div>
                <table className="spec"><tbody>
                  {hasSpecs ? specRows.map((m, i) => <tr key={i}><th>{m![1]}</th><td>{m![2]}</td></tr>) : <>
                    {p.sku && <tr><th>SKU</th><td className="num">{p.sku}</td></tr>}
                    {cat && <tr><th>{t("shop.category")}</th><td>{tr(cat.name, lang)}</td></tr>}
                  </>}
                  {hasSpecs && p.sku && <tr><th>SKU</th><td className="num">{p.sku}</td></tr>}
                </tbody></table>
                {p.variants.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="spec">
                      <tbody>{p.variants.map((v) => <tr key={v.id}><th className="!text-ink">{v.name}</th><td className="num"><bdi dir="ltr">{formatMoney(v.price, cur, lang)}</bdi></td><td className={v.stock > 0 || !p.trackStock ? "text-ok" : "text-danger"}>{v.stock > 0 || !p.trackStock ? t("p.inStock") : t("p.soldOut")}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </details>
            <details className="nh-acc">
              <summary>{t("p.delivery")}</summary>
              <ul className="space-y-4 text-sm">
                <li className="flex gap-3"><Banknote className="size-5 shrink-0 text-brand" strokeWidth={1.3} /><span><b className="block font-medium">{t("cod.payOnDelivery")}</b><span className="text-muted">{t("p.deliveryText")}</span></span></li>
                {s.trust.slice(1).map((b, i) => <li key={i} className="flex gap-3"><Truck className="size-5 shrink-0 text-brand" strokeWidth={1.3} /><span><b className="block font-medium">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></span></li>)}
                {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="micro ulink text-ink">{t("p.shareWa")}</a></li>}
              </ul>
            </details>
          </div>
        </div>
      </div>

      <section id="reviews" className="mx-5 mt-24 scroll-mt-8 border-t border-line pt-12 sm:mx-10" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="display mb-10 text-4xl sm:text-5xl">{t("p.reviews", { n: p.reviewCount })}</h2>
        <div className="grid gap-12 lg:grid-cols-[16rem_1fr_22rem]">
          <div>
            {p.rating != null ? <><p className="display num text-7xl">{p.rating}<span className="text-2xl text-muted">/5</span></p>
              <ul className="mt-4 space-y-1.5 text-xs">{dist.map((d) => <li key={d.n} className="flex items-center gap-2"><span className="num w-3">{d.n}</span><span className="h-px flex-1 bg-line"><span className="block h-px bg-brand" style={{ width: `${(d.c / maxC) * 100}%` }} /></span><span className="num w-4 text-end text-muted">{d.c}</span></li>)}</ul></> : <p className="text-muted">{t("p.noReviews")}</p>}
          </div>
          <ul className="divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                <div className="flex items-center justify-between gap-2"><span className="micro text-ink">{r.name}{r.city && <span> — {r.city}</span>}</span><span className="flex" role="img" aria-label={`${r.rating}/5`}>{stars(r.rating, "size-3")}</span></div>
                <p className="mt-2 leading-relaxed">{r.body}</p>
              </li>
            ))}
            {reviews.length === 0 && <li className="text-muted">{t("p.noReviews")}</li>}
          </ul>
          <div className="h-fit bg-sunken p-6"><h3 className="display mb-3 text-2xl">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="mx-5 mt-24 sm:mx-10">
          <h2 className="display mb-10 border-b border-line pb-5 text-4xl sm:text-5xl">{t("p.related")}</h2>
          <ProductGrid>{related.items.map((r, i) => <ProductCard key={r.id} p={r} i={i + 1} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</ProductGrid>
        </section>
      )}
    </article>
  );
}
