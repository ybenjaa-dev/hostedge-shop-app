import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Repeat, Footprints } from "lucide-react";
import { parseFacts } from "@/lib/facts";
import { shoeRows, fitIndex } from "@/lib/shoesize";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { toMajorString } from "@/lib/money";
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

  const facts = parseFacts(tr(p.specs, lang)).filter((f) => f.value);
  const fitRow = facts.find((f) => /^(fit|chaussant|القياس)$/i.test(f.label));
  const fit = fitIndex(fitRow?.value);
  const sizeKey = [...new Set(p.variants.flatMap((v) => Object.keys(v.options)))].find((k) => /^(size|taille|pointure|المقاس)$/i.test(k));
  const chart = sizeKey ? shoeRows(p.variants.map((v) => v.options[sizeKey] ?? "")) : [];
  const rest = facts.filter((f) => f !== fitRow);
  return (
    <article className="mx-auto max-w-[88rem] px-4 py-6 pb-28 md:py-10 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={s.store.currency} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link> / </>}<span className="text-ink">{name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        <div>
          {cat && <Link href={`/category/${cat.slug}`} className="tag mb-3 hover:!bg-[var(--lime)] hover:!text-[#0d0d0d]"><span>{tr(cat.name, lang)}</span></Link>}
          <h1 className="heading text-[clamp(2.2rem,5.5vw,3.8rem)]">{name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            {p.rating != null ? <><Star className="size-4 fill-accent text-accent" /><span className="num font-bold text-ink">{p.rating}</span> · {t("p.reviews", { n: p.reviewCount })}</> : t("p.noReviews")}
            <span aria-hidden>·</span>
            <span className={inStock ? "font-semibold text-ok" : "font-semibold text-danger"}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          {fit !== null && (
            <div className="mt-5">
              <p className="label mb-2 flex justify-between"><span>{t("p.fit")}</span><span className="normal-case tracking-normal text-ink" dir="auto">{fitRow!.value}</span></p>
              <div className="relative h-2 bg-sunken"><span className="absolute inset-y-0 start-1/3 w-1/3 bg-[var(--lime)]" /><span className="absolute -top-1 size-4 -translate-x-1/2 rotate-45 bg-ink" style={{ insetInlineStart: ["16.6%", "50%", "83.3%"][fit] }} /></div>
              <p className="mt-1.5 flex justify-between text-[0.7rem] font-semibold uppercase text-muted rtl:normal-case"><span>{t("p.fitSmall")}</span><span>{t("p.fitTrue")}</span><span>{t("p.fitLarge")}</span></p>
            </div>
          )}
          <div className="mt-6 border-t-2 border-ink pt-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <ul className="mt-5 space-y-2 text-sm font-semibold">
            <li className="flex items-center gap-3 bg-sunken p-3"><Repeat className="size-4.5 shrink-0" />{t("p.freeSwap")}</li>
            <li className="flex items-center gap-3 bg-sunken p-3"><Footprints className="size-4.5 shrink-0" />{t("p.tryPay")}</li>
          </ul>
        </div>
      </div>

      <section className="mt-14 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="heading mb-4 text-3xl"><span className="marker">{t("p.description")}</span></h2>
          <div className="prose-lite text-muted"><p>{tr(p.longDesc, lang)}</p></div>
          {rest.length > 0 && <dl className="mt-5 divide-y divide-line border-y border-line">{rest.map((f, i) => <div key={i} className="flex justify-between gap-4 py-2.5 text-sm"><dt className="font-bold">{f.label}</dt><dd className="text-end text-muted" dir="auto">{f.value}</dd></div>)}</dl>}
        </div>
        {chart.length > 1 && (
          <div>
            <h2 className="heading mb-2 text-3xl"><span className="marker">{t("p.sizeChart")}</span></h2>
            <p className="mb-4 text-sm text-muted">{t("p.sizeChartD")}</p>
            <table className="size-table"><thead><tr><th>{t("p.eu")}</th><th>{t("p.footCm")}</th></tr></thead><tbody>{chart.map((r) => <tr key={r.size}><td className="font-bold">{r.size}</td><td dir="ltr">{r.cm} cm</td></tr>)}</tbody></table>
          </div>
        )}
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-[1fr_22rem]" aria-labelledby="reviews-h">
        <div>
          <h2 id="reviews-h" className="heading mb-4 text-3xl">{t("p.reviews", { n: p.reviewCount })}</h2>
          {reviews.length === 0 ? <p className="text-muted">{t("p.noReviews")}</p> : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-center justify-between"><span className="font-bold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</span><span className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-accent text-accent" : "text-line"}`} />)}</span></div>
                  <p className="mt-2 text-sm leading-relaxed">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-5"><h3 className="display mb-3 text-lg font-extrabold">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-16">
          <h2 className="heading mb-6 text-3xl">{t("p.related")}</h2>
          <div className="rail">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} />)}</div>
        </section>
      )}
    </article>
  );
}
