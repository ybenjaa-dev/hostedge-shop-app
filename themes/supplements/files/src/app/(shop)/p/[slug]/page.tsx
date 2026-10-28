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
import { parseFacts } from "@/lib/facts";
import { goalIcon } from "@/lib/goal-icon";
import { Info } from "lucide-react";
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
  const facts = parseFacts(tr(p.specs, lang));
  const glance = facts.filter((f) => f.value).slice(0, 3);
  const GoalIcon = goalIcon(`${cat?.slug ?? ""} ${cat ? tr(cat.name, "en") : ""}`);
  return (
    <article className="mx-auto max-w-7xl px-4 py-4 pb-28 md:py-8 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={s.store.currency} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link> / </>}<span className="font-semibold text-ink">{name}</span>
      </nav>
      <div className="grid gap-6 md:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="md:sticky md:top-36 md:self-start"><Gallery images={p.images} alt={name} closeLabel={t("cod.close")} /></div>
        <div>
          {cat && <Link href={`/category/${cat.slug}`} className="chip"><GoalIcon className="size-4 text-brand" aria-hidden />{tr(cat.name, lang)}</Link>}
          <h1 className="display mt-3 text-[clamp(2.1rem,5vw,3.4rem)]">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {p.rating != null ? <span className="inline-flex items-center gap-1"><Star className="size-4 fill-[#f5b301] text-[#f5b301]" /><span className="num font-extrabold">{p.rating}</span><span className="text-muted">({p.reviewCount})</span></span> : <span className="text-muted">{t("p.noReviews")}</span>}
            <span className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${inStock ? "bg-mint text-brand" : "bg-danger/10 text-danger"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          {glance.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("p.keyFacts")}>
              {glance.map((f) => <li key={f.label} className="rounded-xl bg-mint px-3 py-1.5 text-sm"><span className="text-muted">{f.label}:</span> <b>{f.value}</b></li>)}
            </ul>
          )}
          <div className="mt-6 rounded-[1.75rem] border border-line bg-surface p-5 shadow-[0_20px_40px_-34px_rgba(12,59,42,.6)] sm:p-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {s.trust.map((b, i) => <li key={i} className="rounded-2xl bg-mint px-3.5 py-2.5 text-sm leading-snug"><b className="block">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></li>)}
          </ul>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[30rem_1fr]">
        {facts.length > 0 && (
          <section aria-labelledby="facts-h" className="facts h-fit">
            <h2 id="facts-h">{t("p.facts")}</h2>
            <dl>{facts.map((f, i) => <div key={i}><dt>{f.label}</dt>{f.value && <dd>{f.value}</dd>}</div>)}</dl>
          </section>
        )}
        <div className="space-y-5">
          {tr(p.longDesc, lang) && (
            <section className="card p-6"><h2 className="display mb-2 text-2xl">{t("p.howto")}</h2><div className="prose-lite text-muted"><RichText html={tr(p.longDesc, lang)} /></div></section>
          )}
          <aside className="flex gap-3 rounded-[1.5rem] border border-[#f1d98a] bg-[#fff8de] p-5 text-sm leading-relaxed text-[#5b4a10] dark:border-[#6b5a1d] dark:bg-[#2a2410] dark:text-[#e8d89a]" aria-label="Notice"><Info className="mt-0.5 size-5 shrink-0" aria-hidden /><p>{t("p.disclaimer")}</p></aside>
          <section className="card p-6"><h2 className="display mb-2 text-2xl">{t("p.delivery")}</h2><p className="text-muted">{t("p.deliveryText")}</p>{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-3">{t("p.shareWa")}</a>}</section>
        </div>
      </div>

      <section className="mt-14 grid gap-8 md:grid-cols-[1fr_22rem]" aria-labelledby="reviews-h">
        <div>
          <h2 id="reviews-h" className="display mb-5 text-3xl sm:text-4xl">{t("p.reviews", { n: p.reviewCount })}</h2>
          {reviews.length === 0 ? <p className="text-muted">{t("p.noReviews")}</p> : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="card flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-mint font-extrabold text-brand">{r.name.slice(0, 1)}</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3"><b>{r.name}</b>{r.city && <span className="text-sm text-muted">{r.city}</span>}<span className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-[#f5b301] text-[#f5b301]" : "text-line"}`} />)}</span></div><p className="mt-1 leading-relaxed">{r.body}</p></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-5"><h3 className="display mb-3 text-xl">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-16">
          <h2 className="display mb-6 text-3xl sm:text-4xl">{t("p.related")}</h2>
          <div className="rail">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} />)}</div>
        </section>
      )}
    </article>
  );
}
