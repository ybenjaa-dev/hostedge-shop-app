import { RichText } from "@/components/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { toMajorString, formatMoney } from "@/lib/money";
import { parseFacts } from "@/lib/facts";
import { whatsappLink } from "@/lib/phone";
import { Banknote, Truck, Gift } from "lucide-react";
import { getProduct, listBundles, listCities, listProducts, listReviews, listCategories } from "@/features/catalog/queries";
import { Gallery } from "@/features/catalog/components/gallery";
import { ProductBuy } from "@/features/checkout/components/product-buy";
import { ProductCard } from "@/features/catalog/components/product-card";
import { ReviewForm } from "@/features/catalog/components/review-form";
import { ViewContent } from "@/features/catalog/components/view-content";

function Stars({ v, cls = "text-xs" }: { v: number; cls?: string }) {
  return <span className={`tracking-[0.2em] text-brand ${cls}`} role="img" aria-label={`${v}/5`}>{"✦".repeat(Math.round(v))}<span className="text-[var(--rule)]">{"✦".repeat(5 - Math.round(v))}</span></span>;
}

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
  const specs = parseFacts(tr(p.specs, lang)).filter((f) => f.value);
  const story = tr(p.longDesc, lang);
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const maxC = Math.max(1, ...dist.map((d) => d.c));
  const h2 = "eyebrow mb-6";
  return (
    <article className="pb-28 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={cur} />
      <div className="lg:grid lg:grid-cols-2">
        <div className="lg:sticky lg:top-[var(--hdr)] lg:h-[calc(100svh-var(--hdr))]">
          <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        </div>

        <div className="px-6 py-12 md:px-14 lg:px-16 lg:py-20 xl:px-24">
          <div className="mx-auto max-w-xl">
            <nav aria-label="Breadcrumb" className="caps text-[0.62rem] text-muted">
              <Link href="/shop" className="lx-link">{t("nav.shop")}</Link>{cat && <> <span aria-hidden className="mx-2 text-brand">·</span> <Link href={`/category/${cat.slug}`} className="lx-link">{tr(cat.name, lang)}</Link></>}
            </nav>
            <h1 className="display lx-rise mt-8 text-5xl md:text-6xl">{name}</h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {p.rating != null ? <a href="#reviews" className="inline-flex items-center gap-3 text-muted"><Stars v={p.rating} /><span className="lx-link">{t("p.reviews", { n: p.reviewCount })}</span></a> : null}
              {p.sku && <span className="caps text-[0.62rem] text-muted">Ref. <span className="lx-num text-sm tracking-normal text-ink">{p.sku}</span></span>}
              <span className={`caps text-[0.62rem] ${inStock ? "text-brand" : "text-danger"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
            </p>
            <p className="display mt-8 text-2xl italic leading-snug text-muted">{tr(p.shortDesc, lang)}</p>
            <div className="mt-10 border-t border-line pt-10">
              <ProductBuy
                autoOpen={sp.order === "1"}
                product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
                bundles={bundles}
                cities={cities}
              />
            </div>

            <div className="mt-8 flex items-start gap-4 border border-line p-5">
              <Gift className="mt-0.5 size-5 shrink-0 text-brand" strokeWidth={1.2} aria-hidden />
              <div><p className="caps text-[0.68rem]">{t("lux.gift")}</p><p className="mt-1.5 text-sm text-muted">{t("lux.giftText")}</p></div>
            </div>

            <section id="description" className="mt-20 scroll-mt-28">
              <h2 className={h2}>{t("lux.story")}</h2>
              <RichText html={story || tr(p.shortDesc, lang)} className="prose-lite text-lg leading-8 text-muted" />
            </section>

            <section id="details" className="mt-16 scroll-mt-28">
              <h2 className={h2}>{t("lux.specs")}</h2>
              <dl className="spec border-t border-line">
                {specs.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
                {p.sku && <div><dt>Ref.</dt><dd className="lx-num text-lg">{p.sku}</dd></div>}
                {cat && <div><dt>{t("shop.category")}</dt><dd><Link href={`/category/${cat.slug}`} className="lx-link">{tr(cat.name, lang)}</Link></dd></div>}
              </dl>
              {p.variants.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <table className="spec">
                    <thead><tr><th>{t("p.chooseOptions")}</th><th>{t("shop.price")}</th><th>{t("track.status")}</th></tr></thead>
                    <tbody>{p.variants.map((v) => <tr key={v.id}><td>{v.name}</td><td className="lx-num text-base"><bdi dir="ltr">{formatMoney(v.price, cur, lang)}</bdi></td><td className={`caps text-[0.62rem] ${v.stock > 0 || !p.trackStock ? "text-brand" : "text-danger"}`}>{v.stock > 0 || !p.trackStock ? t("p.inStock") : t("p.soldOut")}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-16" aria-label={t("p.delivery")}>
              <h2 className={h2}>{t("p.delivery")}</h2>
              <ul className="divide-y divide-[var(--line)] border-y border-line text-sm">
                <li className="flex gap-4 py-5"><Banknote className="size-5 shrink-0 text-brand" strokeWidth={1.2} aria-hidden /><span><b className="caps block text-[0.66rem]">{t("cod.payOnDelivery")}</b><span className="mt-1 block text-muted">{t("p.deliveryText")}</span></span></li>
                {s.trust.slice(1).map((b, i) => <li key={i} className="flex gap-4 py-5"><Truck className="size-5 shrink-0 text-brand" strokeWidth={1.2} aria-hidden /><span><b className="caps block text-[0.66rem]">{tr(b.title, lang)}</b><span className="mt-1 block text-muted">{tr(b.text, lang)}</span></span></li>)}
              </ul>
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="caps lx-link mt-6 inline-block">{t("p.shareWa")}</a>}
            </section>

            <section id="reviews" className="mt-16 scroll-mt-28" aria-labelledby="reviews-h">
              <h2 id="reviews-h" className={h2}>{t("p.reviews", { n: p.reviewCount })}</h2>
              {p.rating != null ? (
                <div className="flex items-center gap-8 border-t border-line py-6">
                  <p className="display text-6xl">{p.rating}<span className="text-xl text-muted">/5</span></p>
                  <ul className="flex-1 space-y-1.5 text-xs">{dist.map((d) => <li key={d.n} className="flex items-center gap-3"><span className="lx-num w-3 text-sm">{d.n}</span><span className="h-px flex-1 bg-[var(--line)]"><span className="block h-px bg-brand" style={{ width: `${(d.c / maxC) * 100}%` }} /></span><span className="lx-num w-4 text-end text-sm text-muted">{d.c}</span></li>)}</ul>
                </div>
              ) : <p className="border-t border-line pt-6 text-muted">{t("p.noReviews")}</p>}
              <ul className="divide-y divide-[var(--line)] border-t border-line">
                {reviews.map((r) => (
                  <li key={r.id} className="py-6">
                    <div className="flex items-center justify-between gap-2"><span className="caps text-[0.66rem]">{r.name}{r.city && <span className="text-muted"> — {r.city}</span>}</span><Stars v={r.rating} cls="text-[0.6rem]" /></div>
                    <p className="display mt-3 text-xl italic leading-snug">“{r.body}”</p>
                  </li>
                ))}
              </ul>
              <details className="mt-4 border-t border-line pt-6">
                <summary className="caps lx-link inline-block cursor-pointer">{t("p.writeReview")}</summary>
                <div className="lx-pop mt-6"><ReviewForm productId={p.id} /></div>
              </details>
            </section>
          </div>
        </div>
      </div>

      {related.items.length > 0 && (
        <section className="mx-auto max-w-[100rem] border-t border-line px-6 pt-24 md:px-12 lg:mt-0">
          <h2 className="display mb-14 text-center text-4xl md:text-6xl">{t("p.related")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-4 md:gap-x-10">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={cur} />)}</div>
        </section>
      )}
    </article>
  );
}
