import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Sprout } from "lucide-react";
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
import { careOf } from "@/features/catalog/care";
import { CareTiles, CareTabs, BoxList } from "@/features/catalog/components/plant-care";
import { Sprig } from "@/components/botanical";
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
  const care = careOf(p.slug);
  const kind = care?.kind ?? "plant";
  const crumb = "chip !py-0 !text-xs";
  return (
    <article className="mx-auto max-w-[78rem] px-4 pb-48 pt-5 md:pb-10 md:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={cur} />
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5">
        <Link href="/" className={crumb}>{t("nav.home")}</Link><span aria-hidden>/</span><Link href="/shop" className={crumb}>{t("nav.shop")}</Link><span aria-hidden>/</span>{cat && <><Link href={`/category/${cat.slug}`} className={crumb}>{tr(cat.name, lang)}</Link><span aria-hidden>/</span></>}<span className={`${crumb} is-on`}>{name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-12">
        <div className="relative md:sticky md:top-24 md:self-start">
          <Sprig className="pointer-events-none absolute -top-4 -end-2 z-10 hidden w-14 rotate-12 text-[#2f8452] sm:block" />
          <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        </div>
        <div>
          {cat && <Link href={`/category/${cat.slug}`} className="sticker mb-3">{tr(cat.name, lang)}</Link>}
          <h1 className="display text-4xl sm:text-5xl">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            {p.rating != null ? <a href="#reviews" className="chip"><span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < Math.round(p.rating!) ? "fill-accent text-ink" : "text-ink/30"}`} />)}</span><span className="num font-bold">{p.rating}</span> · {t("p.reviews", { n: p.reviewCount })}</a> : <span className="text-muted">{t("p.noReviews")}</span>}
            <span className={`chip ${inStock ? "!bg-mint !text-[#1f3d2b]" : "!bg-blush !text-[#1f3d2b]"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
            {p.sku && <span className="text-muted">SKU <span className="num font-semibold text-ink">{p.sku}</span></span>}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          <div className="mt-5"><CareTiles care={care} t={t} /></div>
          <div className="nb mt-6 p-5">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <aside className="mt-5 rounded-3xl border-2 border-dashed border-edge bg-surface/70 p-4 text-sm" aria-label={t("p.delivery")}>
            <h2 className="display mb-2 text-lg">{t("p.delivery")}</h2>
            <ul className="space-y-2.5">
              <li className="flex gap-3"><Banknote className="size-5 shrink-0 text-coral" /><span><b className="block">{t("cod.payOnDelivery")}</b><span className="text-muted">{t("p.deliveryText")}</span></span></li>
              {s.trust.slice(1).map((b, i) => <li key={i} className="flex gap-3"><Truck className="size-5 shrink-0 text-coral" /><span><b className="block">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></span></li>)}
              {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm w-full">{t("p.shareWa")}</a></li>}
            </ul>
          </aside>
        </div>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {care?.light && (
          <section id="care" className="nb p-6 sm:p-8" aria-labelledby="care-h">
            <h2 id="care-h" className="display mb-5 flex items-center gap-2 text-3xl"><Sprout className="size-7 text-[#2f8452]" aria-hidden />{t("care.title")}</h2>
            <CareTabs care={care} t={t} />
          </section>
        )}
        <section className={`nb bg-sun/40 p-6 sm:p-8 ${care?.light ? "" : "lg:col-span-2"}`}><BoxList kind={kind} t={t} /></section>
      </div>

      <section id="description" className="nb mt-8 scroll-mt-28 p-6 sm:p-8">
        <h2 className="display mb-3 text-3xl">{t("p.description")}</h2>
        <div className="prose-lite max-w-3xl text-lg"><p>{tr(p.longDesc, lang) || tr(p.shortDesc, lang)}</p></div>
        <h2 id="details" className="display mb-3 mt-8 text-2xl">{t("p.details")}</h2>
        <table className="spec">
          <tbody>
            {p.sku && <tr><th>SKU</th><td className="num">{p.sku}</td></tr>}
            {cat && <tr><th>{t("shop.category")}</th><td><Link href={`/category/${cat.slug}`} className="font-semibold underline decoration-coral decoration-2 underline-offset-4">{tr(cat.name, lang)}</Link></td></tr>}
            <tr><th>{t("track.status")}</th><td>{inStock ? t("p.inStock") : t("p.soldOut")}</td></tr>
            <tr><th>{t("cod.payOnDelivery")}</th><td>{t("p.deliveryText")}</td></tr>
          </tbody>
        </table>
        {p.variants.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="spec">
              <thead><tr><th>{t("p.chooseOptions")}</th><th>SKU</th><th>{t("shop.price")}</th><th>{t("track.status")}</th></tr></thead>
              <tbody>{p.variants.map((v) => <tr key={v.id}><td className="font-semibold">{v.name}</td><td className="num">{v.sku ?? "—"}</td><td className="num"><bdi dir="ltr">{formatMoney(v.price, cur, lang)}</bdi></td><td className={v.stock > 0 || !p.trackStock ? "font-bold text-ok" : "font-bold text-danger"}>{v.stock > 0 || !p.trackStock ? t("p.inStock") : t("p.soldOut")}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section id="reviews" className="mt-14 scroll-mt-28" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="display mb-6 text-3xl sm:text-4xl">{t("p.reviews", { n: p.reviewCount })}</h2>
        <div className="grid gap-8 md:grid-cols-[14rem_1fr] lg:grid-cols-[14rem_1fr_20rem]">
          <div className="nb h-fit p-5">
            {p.rating != null ? <><p className="display num text-6xl">{p.rating}<span className="text-xl text-muted">/5</span></p>
              <ul className="mt-3 space-y-1.5 text-xs">{dist.map((d) => <li key={d.n} className="flex items-center gap-2"><span className="num w-3">{d.n}</span><Star className="size-3 fill-accent text-ink" /><span className="h-3 flex-1 overflow-hidden rounded-full border-2 border-edge bg-surface"><span className="block h-full bg-coral" style={{ width: `${(d.c / maxC) * 100}%` }} /></span><span className="num w-4 text-end text-muted">{d.c}</span></li>)}</ul></> : <p className="text-muted">{t("p.noReviews")}</p>}
          </div>
          <ul className="grid content-start gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-1">
            {reviews.map((r, i) => (
              <li key={r.id} className={`sticky-note p-4 text-[#1f3d2b] ${NOTE_BG[i % NOTE_BG.length]}`} style={{ transform: `rotate(${[-0.8, 0.6][i % 2]}deg)` }}>
                <div className="flex items-center justify-between gap-2"><span className="display">{r.name}{r.city && <span className="font-sans text-sm font-normal opacity-70"> · {r.city}</span>}</span><span className="flex" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-3.5 ${k < r.rating ? "fill-[#ff6b4a] text-[#1f3d2b]" : "text-[#1f3d2b]/30"}`} />)}</span></div>
                <p className="mt-1.5">{r.body}</p>
              </li>
            ))}
            {reviews.length === 0 && <li className="nb p-5 text-muted">{t("p.noReviews")}</li>}
          </ul>
          <div className="nb h-fit p-5 md:col-span-2 lg:col-span-1"><h3 className="display mb-3 text-xl">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-16">
          <h2 className="display mb-6 text-3xl sm:text-4xl">{t("p.related")}</h2>
          <ProductGrid>{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</ProductGrid>
        </section>
      )}
    </article>
  );
}

const NOTE_BG = ["bg-sun", "bg-mint", "bg-blush", "bg-sky"];
