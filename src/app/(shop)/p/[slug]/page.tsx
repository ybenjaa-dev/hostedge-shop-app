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
import { ProductCard } from "@/features/catalog/components/product-card";
import { ReviewForm } from "@/features/catalog/components/review-form";
import { ViewContent } from "@/features/catalog/components/view-content";

const W = "mx-auto max-w-[90rem] px-4 sm:px-8";

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
  return (
    <article className="pb-28 md:pb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={cur} />
      <div className="relative overflow-hidden">
        <p aria-hidden className="display outline-text pointer-events-none absolute -top-2 start-0 select-none whitespace-nowrap text-[clamp(7rem,26vw,24rem)] leading-[0.8] opacity-50" style={{ ["--stroke" as string]: "var(--line)" }}>{cat ? tr(cat.name, lang) : s.store.name}</p>
        <div className={`${W} relative grid gap-8 py-5 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-8`}>
          <nav aria-label="Breadcrumb" className="kicker lg:col-span-2">
            <Link href="/" className="hover:underline">{t("nav.home")}</Link> / <Link href="/shop" className="hover:underline">{t("nav.shop")}</Link>{cat && <> / <Link href={`/category/${cat.slug}`} className="hover:underline">{tr(cat.name, lang)}</Link></>}
          </nav>
          <div className="lg:sticky lg:top-28 lg:self-start"><Gallery images={p.images} alt={name} closeLabel={t("cod.close")} /></div>
          <div className="min-w-0">
            <h1 className="display text-[clamp(2.8rem,7vw,5.5rem)]">{name}</h1>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {p.rating != null ? <a href="#reviews" className="inline-flex items-center gap-1.5 font-bold hover:text-[var(--brand)]"><Star className="size-4 fill-[var(--brand)] text-[var(--brand)]" /><span className="num">{p.rating}</span><span className="text-muted">· {t("p.reviews", { n: p.reviewCount })}</span></a> : <span className="text-muted">{t("p.noReviews")}</span>}
              <span className={`skew px-2.5 py-0.5 text-xs font-black uppercase tracking-widest ${inStock ? "lime" : "bg-danger text-white"}`}><span>{inStock ? t("p.inStock") : t("p.soldOut")}</span></span>
            </p>
            <p className="mt-4 max-w-xl text-lg leading-snug text-muted">{tr(p.shortDesc, lang)}</p>
            <div className="mt-6">
              <ProductBuy
                autoOpen={sp.order === "1"}
                product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
                bundles={bundles}
                cities={cities}
              />
            </div>
            <ul className="mt-8 grid gap-px bg-line text-sm" aria-label={t("p.delivery")}>
              <li className="flex gap-3 bg-surface p-3.5"><Banknote className="size-5 shrink-0 text-brand" /><span><b className="block uppercase tracking-wide">{t("cod.payOnDelivery")}</b><span className="text-muted">{t("p.deliveryText")}</span></span></li>
              {s.trust.slice(1).map((b, i) => <li key={i} className="flex gap-3 bg-surface p-3.5"><Truck className="size-5 shrink-0 text-brand" /><span><b className="block uppercase tracking-wide">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></span></li>)}
              {wa && <li className="bg-surface p-3"><a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm w-full">{t("p.shareWa")}</a></li>}
            </ul>
          </div>
        </div>
      </div>

      <section id="details" className="slant mt-10 scroll-mt-28 bg-surface">
        <div className={`${W} max-w-4xl`}>
          <div>
            <p className="kicker mb-2">{t("sp.profile")}</p>
            <h2 className="display mb-6 text-[clamp(2.4rem,6vw,4rem)]">{t("sp.spec")}</h2>
            <table className="spec-table text-sm">
              <tbody>
                {p.sku && <tr><th>SKU</th><td className="num font-bold">{p.sku}</td></tr>}
                {cat && <tr><th>{t("shop.category")}</th><td><Link href={`/category/${cat.slug}`} className="font-bold hover:text-[var(--brand)]">{tr(cat.name, lang)}</Link></td></tr>}
                <tr><th>{t("track.status")}</th><td className="font-bold">{inStock ? t("p.inStock") : t("p.soldOut")}</td></tr>
                <tr><th>{t("cod.payOnDelivery")}</th><td>{t("p.deliveryText")}</td></tr>
              </tbody>
            </table>
            {p.variants.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="spec-table text-sm">
                  <thead><tr className="text-xs uppercase tracking-widest text-muted"><th className="!border-0">{t("p.chooseOptions")}</th><th className="!border-0">SKU</th><th className="!border-0">{t("shop.price")}</th><th className="!border-0">{t("track.status")}</th></tr></thead>
                  <tbody>{p.variants.map((v) => <tr key={v.id}><td className="font-bold">{v.name}</td><td className="num">{v.sku ?? "—"}</td><td className="num"><bdi dir="ltr">{formatMoney(v.price, cur, lang)}</bdi></td><td className={v.stock > 0 || !p.trackStock ? "font-bold text-ok" : "font-bold text-danger"}>{v.stock > 0 || !p.trackStock ? t("p.inStock") : t("p.soldOut")}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            <h3 className="kicker mb-3 mt-8">{t("p.description")}</h3>
            <RichText html={tr(p.longDesc, lang) || tr(p.shortDesc, lang)} className="prose-lite max-w-2xl text-muted" />
          </div>
        </div>
      </section>

      <section id="reviews" className={`${W} scroll-mt-28 pt-4`} aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="display mb-6 text-[clamp(2.4rem,6vw,4rem)]">{t("p.reviews", { n: p.reviewCount })}</h2>
        <div className="grid gap-8 md:grid-cols-[14rem_1fr] lg:grid-cols-[14rem_1fr_22rem]">
          <div>
            {p.rating != null ? <><p className="display num text-8xl text-[var(--brand)]">{p.rating}<span className="text-3xl text-muted">/5</span></p>
              <ul className="mt-3 space-y-1.5 text-xs">{dist.map((d) => <li key={d.n} className="flex items-center gap-2"><span className="num w-3 font-bold">{d.n}</span><span className="statbar flex-1"><i style={{ width: `${(d.c / maxC) * 100}%` }} /></span><span className="num w-4 text-end text-muted">{d.c}</span></li>)}</ul></> : <p className="text-muted">{t("p.noReviews")}</p>}
          </div>
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="border-s-4 border-[var(--brand)] bg-surface p-4">
                <div className="flex items-center justify-between gap-2"><span className="text-sm font-black uppercase tracking-wider">{r.name}{r.city && <span className="font-medium normal-case tracking-normal text-muted"> — {r.city}</span>}</span><span className="flex" role="img" aria-label={`/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-[var(--brand)] text-[var(--brand)]" : "text-rule"}`} />)}</span></div>
                <p className="mt-1.5">{r.body}</p>
              </li>
            ))}
            {reviews.length === 0 && <li className="bg-surface p-4 text-muted">{t("p.noReviews")}</li>}
          </ul>
          <div className="h-fit bg-surface p-5 md:col-span-2 lg:col-span-1"><h3 className="display mb-3 text-2xl">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
        </div>
      </section>

      {related.items.length > 0 && (
        <section className="pt-14">
          <div className={W}><h2 className="display mb-4 text-[clamp(2.4rem,6vw,4rem)]">{t("p.related")}</h2></div>
          <div className="shelf !ps-4 sm:!ps-8">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</div>
        </section>
      )}
    </article>
  );
}
