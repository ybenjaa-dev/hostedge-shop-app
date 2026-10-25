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
  const cur = s.store.currency;
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: reviews.filter((r) => r.rating === n).length }));
  const maxC = Math.max(1, ...dist.map((d) => d.c));
  const tab = "border-e border-line px-5 py-3 text-sm font-extrabold uppercase tracking-wide hover:bg-sunken hover:text-brand";
  return (
    <article className="mx-auto max-w-[84rem] px-3 py-3 pb-28 md:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={cur} />
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-brand hover:underline">{t("nav.home")}</Link> › <Link href="/shop" className="hover:text-brand hover:underline">{t("nav.shop")}</Link> › {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-brand hover:underline">{tr(cat.name, lang)}</Link> › </>}<span className="font-bold text-ink">{name}</span>
      </nav>
      <div className="panel grid gap-6 p-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_17rem]">
        <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        <div>
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-3 text-sm">
            {p.rating != null ? <span className="inline-flex items-center gap-1"><span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < Math.round(p.rating!) ? "fill-accent text-accent" : "text-rule"}`} />)}</span><a href="#reviews" className="font-bold text-brand hover:underline"><span className="num">{p.rating}</span> · {t("p.reviews", { n: p.reviewCount })}</a></span> : <span className="text-muted">{t("p.noReviews")}</span>}
            {p.sku && <span className="text-muted">SKU: <span className="num font-semibold text-ink">{p.sku}</span></span>}
            <span className={`font-extrabold ${inStock ? "text-ok" : "text-danger"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-3 leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          <div className="mt-4">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
        </div>
        <aside className="h-fit border border-line bg-sunken text-sm md:col-span-2 xl:col-span-1 xl:sticky xl:top-36" aria-label={t("p.delivery")}>
          <h2 className="bar bar-brand !text-xs">{t("p.delivery")}</h2>
          <ul className="divide-y divide-line">
            <li className="flex gap-3 p-3"><Banknote className="size-5 shrink-0 text-brand" /><span><b className="block">{t("cod.payOnDelivery")}</b><span className="text-muted">{t("p.deliveryText")}</span></span></li>
            {s.trust.slice(1).map((b, i) => <li key={i} className="flex gap-3 p-3"><Truck className="size-5 shrink-0 text-brand" /><span><b className="block">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></span></li>)}
            {wa && <li className="p-3"><a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm w-full">{t("p.shareWa")}</a></li>}
          </ul>
        </aside>
      </div>

      <nav aria-label="Sections" className="panel sticky top-[6.2rem] z-20 mt-3 flex overflow-x-auto md:top-[7.4rem]">
        <a href="#description" className={tab}>{t("p.description")}</a>
        <a href="#details" className={tab}>{t("p.details")}</a>
        <a href="#reviews" className={tab}>{t("p.reviews", { n: p.reviewCount })}</a>
      </nav>

      <section id="description" className="panel mt-3 scroll-mt-48 p-4">
        <h2 className="mb-2 text-lg font-extrabold">{t("p.description")}</h2>
        <div className="prose-lite max-w-3xl"><p>{tr(p.longDesc, lang) || tr(p.shortDesc, lang)}</p></div>
      </section>

      <section id="details" className="panel mt-3 scroll-mt-48 p-4">
        <h2 className="mb-3 text-lg font-extrabold">{t("p.details")}</h2>
        <table className="spec">
          <tbody>
            {p.sku && <tr><th>SKU</th><td className="num">{p.sku}</td></tr>}
            {cat && <tr><th>{t("shop.category")}</th><td><Link href={`/category/${cat.slug}`} className="text-brand hover:underline">{tr(cat.name, lang)}</Link></td></tr>}
            <tr><th>{t("track.status")}</th><td>{inStock ? t("p.inStock") : t("p.soldOut")}</td></tr>
            <tr><th>{t("cod.payOnDelivery")}</th><td>{t("p.deliveryText")}</td></tr>
          </tbody>
        </table>
        {p.variants.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="spec">
              <thead><tr><th>{t("p.chooseOptions")}</th><th>SKU</th><th>{t("shop.price")}</th><th>{t("track.status")}</th></tr></thead>
              <tbody>{p.variants.map((v) => <tr key={v.id}><td className="font-semibold">{v.name}</td><td className="num">{v.sku ?? "—"}</td><td className="num"><bdi dir="ltr">{formatMoney(v.price, cur, lang)}</bdi></td><td className={v.stock > 0 || !p.trackStock ? "font-bold text-ok" : "font-bold text-danger"}>{v.stock > 0 || !p.trackStock ? t("p.inStock") : t("p.soldOut")}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section id="reviews" className="panel mt-3 scroll-mt-48 p-4" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="mb-3 text-lg font-extrabold">{t("p.reviews", { n: p.reviewCount })}</h2>
        <div className="grid gap-6 md:grid-cols-[16rem_1fr_20rem]">
          <div>
            {p.rating != null ? <><p className="num text-5xl font-extrabold">{p.rating}<span className="text-xl text-muted">/5</span></p>
              <ul className="mt-2 space-y-1 text-xs">{dist.map((d) => <li key={d.n} className="flex items-center gap-2"><span className="num w-3">{d.n}</span><Star className="size-3 fill-accent text-accent" /><span className="h-2.5 flex-1 bg-sunken"><span className="block h-full bg-accent" style={{ width: `${(d.c / maxC) * 100}%` }} /></span><span className="num w-4 text-end text-muted">{d.c}</span></li>)}</ul></> : <p className="text-muted">{t("p.noReviews")}</p>}
          </div>
          <ul className="divide-y divide-line border border-line">
            {reviews.map((r) => (
              <li key={r.id} className="p-3">
                <div className="flex items-center justify-between gap-2"><span className="font-bold">{r.name}{r.city && <span className="font-normal text-muted"> — {r.city}</span>}</span><span className="flex" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-rule"}`} />)}</span></div>
                <p className="mt-1">{r.body}</p>
              </li>
            ))}
            {reviews.length === 0 && <li className="p-4 text-muted">{t("p.noReviews")}</li>}
          </ul>
          <div className="h-fit border border-line bg-sunken p-4"><h3 className="mb-2 font-extrabold">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="panel mt-3">
          <div className="bar"><h2>{t("p.related")}</h2></div>
          <div className="rail">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</div>
        </section>
      )}
    </article>
  );
}
