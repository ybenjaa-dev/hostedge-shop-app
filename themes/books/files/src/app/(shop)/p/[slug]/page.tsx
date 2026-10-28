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
import { splitBookDesc } from "@/features/catalog/book-meta";
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
  const author = tr(p.shortDesc, lang);
  const { body: sample, meta } = splitBookDesc(tr(p.longDesc, lang));
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
  return (
    <article className="mx-auto max-w-[80rem] px-4 py-6 pb-28 sm:py-10 md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={cur} />
      <nav aria-label="Breadcrumb" className="eyebrow !text-muted mb-6">
        <Link href="/" className="hover:text-brand">{t("nav.home")}</Link> / <Link href="/shop" className="hover:text-brand">{t("nav.shop")}</Link>{cat && <> / <Link href={`/category/${cat.slug}`} className="hover:text-brand">{tr(cat.name, lang)}</Link></>}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-16">
        <div className="self-start border border-line bg-sunken/70 px-6 py-10 sm:px-12 lg:sticky lg:top-6">
          <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        </div>
        <div className="min-w-0">
          {cat && <Link href={`/category/${cat.slug}`} className="pill is-on !px-3 !py-0.5 !text-[0.7rem] uppercase tracking-widest rtl:tracking-normal">{tr(cat.name, lang)}</Link>}
          <h1 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">{name}</h1>
          {author && <p className="italic-serif mt-2 text-xl text-muted sm:text-2xl">{t("bk.byline", { name: author })}</p>}
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-sm">
            {p.rating != null ? <span className="inline-flex items-center gap-1.5"><span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < Math.round(p.rating!) ? "fill-accent text-accent" : "text-rule"}`} />)}</span><a href="#reviews" className="font-semibold hover:text-brand hover:underline"><span className="num">{p.rating}</span> · {t("p.reviews", { n: p.reviewCount })}</a></span> : <span className="text-muted">{t("p.noReviews")}</span>}
            <span className={`text-xs font-bold uppercase tracking-[0.14em] rtl:tracking-normal ${inStock ? "text-ok" : "text-danger"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <div className="mt-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <aside className="mt-8 border-t border-line pt-5 text-sm" aria-label={t("p.delivery")}>
            <h2 className="eyebrow mb-3">{t("p.delivery")}</h2>
            <ul className="space-y-3">
              <li className="flex gap-3"><Banknote className="size-5 shrink-0 text-brand" aria-hidden /><span><b className="block">{t("cod.payOnDelivery")}</b><span className="text-muted">{t("p.deliveryText")}</span></span></li>
              {s.trust.slice(1).map((b, i) => <li key={i} className="flex gap-3"><Truck className="size-5 shrink-0 text-brand" aria-hidden /><span><b className="block">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></span></li>)}
              {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">{t("p.shareWa")}</a></li>}
            </ul>
          </aside>
        </div>
      </div>

      <div className="rule-double mt-14 grid gap-10 border-b border-line pb-12 pt-10 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-16">
        <section id="details" aria-labelledby="details-h">
          <h2 id="details-h" className="display mb-2 text-2xl">{t("bk.details")}</h2>
          <table className="spec">
            <tbody>
              {author && <tr><th>{t("bk.author")}</th><td className="serif text-base italic">{author}</td></tr>}
              {cat && <tr><th>{t("bk.genre")}</th><td><Link href={`/category/${cat.slug}`} className="hover:text-brand hover:underline">{tr(cat.name, lang)}</Link></td></tr>}
              {meta.map(([k, v]) => <tr key={k}><th>{k}</th><td className="num">{v}</td></tr>)}
              {p.sku && <tr><th>SKU</th><td className="num">{p.sku}</td></tr>}
              <tr><th>{t("track.status")}</th><td>{inStock ? t("p.inStock") : t("p.soldOut")}</td></tr>
            </tbody>
          </table>
          {p.variants.length > 0 && (
            <table className="spec mt-4">
              <thead><tr><th>{t("p.chooseOptions")}</th><th>{t("shop.price")}</th></tr></thead>
              <tbody>{p.variants.map((v) => <tr key={v.id}><td className="font-semibold">{v.name}</td><td className="num"><bdi dir="ltr">{formatMoney(v.price, cur, lang)}</bdi></td></tr>)}</tbody>
            </table>
          )}
        </section>
        <section id="description" aria-labelledby="desc-h" className="min-w-0">
          <p className="eyebrow">{t("bk.sample")}</p>
          <h2 id="desc-h" className="sr-only">{t("p.description")}</h2>
          <RichText html={sample || author} className="sample mt-4 max-w-2xl" />
          <p className="display mt-2 text-center text-2xl tracking-[0.5em] text-brand" aria-hidden>❦</p>
        </section>
      </div>

      <section id="reviews" className="scroll-mt-8 py-12" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="display mb-8 text-center text-3xl sm:text-4xl">{t("bk.readers")}</h2>
        <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)_20rem]">
          <div className="text-center lg:text-start">
            {p.rating != null ? <><p className="num display text-6xl">{p.rating}<span className="text-xl text-muted">/5</span></p>
              <ul className="mx-auto mt-3 max-w-[14rem] space-y-1 text-xs">{dist.map((d) => <li key={d.n} className="flex items-center gap-2"><span className="num w-3">{d.n}</span><Star className="size-3 fill-accent text-accent" /><span className="h-1.5 flex-1 rounded-full bg-sunken"><span className="block h-full rounded-full bg-brand" style={{ width: `${(d.c / maxC) * 100}%` }} /></span><span className="num w-4 text-end text-muted">{d.c}</span></li>)}</ul></> : <p className="italic-serif text-muted">{t("p.noReviews")}</p>}
          </div>
          <ul className="space-y-6">
            {reviews.map((r) => (
              <li key={r.id} className="border-s-2 border-brand ps-5">
                <span className="flex" role="img" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-rule"}`} />)}</span>
                <p className="serif mt-1.5 text-lg italic leading-relaxed">“{r.body}”</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-muted rtl:tracking-normal">{r.name}{r.city && <span className="font-normal normal-case tracking-normal"> — {r.city}</span>}</p>
              </li>
            ))}
            {reviews.length === 0 && <li className="italic-serif text-muted">{t("p.noReviews")}</li>}
          </ul>
          <div className="h-fit border border-ink bg-surface p-5 shadow-[4px_4px_0_var(--ink)]"><h3 className="display mb-3 text-xl">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="rule-double pt-10">
          <h2 className="display mb-2 text-center text-3xl sm:text-4xl">{t("p.related")}</h2>
          <ProductGrid>{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</ProductGrid>
        </section>
      )}
    </article>
  );
}
