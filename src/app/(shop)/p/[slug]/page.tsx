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
  const acc = "group rounded-[1.4rem] border border-line bg-surface";
  const sum = "flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden";
  const chev = <span aria-hidden className="text-xl leading-none text-brand transition group-open:rotate-45">+</span>;
  return (
    <article className="mx-auto max-w-7xl px-4 py-5 pb-28 md:py-10 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={s.store.currency} />
      <nav aria-label="Breadcrumb" className="eyebrow mb-5">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> · {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link> · </>}<span className="text-ink">{name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="mx-auto w-full max-w-xl md:sticky md:top-28 md:self-start"><Gallery images={p.images} alt={name} closeLabel={t("cod.close")} /></div>
        <div>
          {cat && <p className="eyebrow">{tr(cat.name, lang)}</p>}
          <h1 className="display mt-2 text-[clamp(2.2rem,5.5vw,3.6rem)]">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {p.rating != null ? <span className="inline-flex items-center gap-1"><Star className="size-4 fill-rose text-rose" /><span className="num font-bold">{p.rating}</span><span className="text-muted">({p.reviewCount})</span></span> : <span className="text-muted">{t("p.noReviews")}</span>}
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${inStock ? "bg-brand-soft text-brand" : "bg-danger/10 text-danger"}`}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          <div className="mt-6 rounded-[1.75rem] border border-line bg-surface/70 p-5 sm:p-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {s.trust.map((b, i) => <li key={i} className="rounded-2xl bg-sunken px-4 py-3 text-center text-sm"><b className="block font-semibold">{tr(b.title, lang)}</b><span className="text-muted">{tr(b.text, lang)}</span></li>)}
          </ul>
          <div className="mt-6 space-y-3">
            {tr(p.longDesc, lang) && <details className={acc} open><summary className={sum}>{t("p.ritual")}{chev}</summary><div className="prose-lite px-5 pb-5 text-muted"><p>{tr(p.longDesc, lang)}</p></div></details>}
            <details className={acc}><summary className={sum}>{t("p.delivery")}{chev}</summary><div className="px-5 pb-5 text-muted"><p>{t("p.deliveryText")}</p>{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm mt-3">{t("p.shareWa")}</a>}</div></details>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-10 md:grid-cols-[1fr_22rem]" aria-labelledby="reviews-h">
        <div>
          <h2 id="reviews-h" className="display mb-6 text-3xl sm:text-4xl">{t("p.reviews", { n: p.reviewCount })}</h2>
          {reviews.length === 0 ? <p className="text-muted">{t("p.noReviews")}</p> : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="card flex gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand">{r.name.slice(0, 1)}</span>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3"><b>{r.name}</b>{r.city && <span className="text-sm text-muted">{r.city}</span>}<span className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-rose text-rose" : "text-line"}`} />)}</span></div><p className="mt-1 leading-relaxed">{r.body}</p></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-6"><h3 className="display mb-3 text-2xl">{t("p.writeReview")}</h3><ReviewForm productId={p.id} /></div>
      </section>

      {related.items.length > 0 && (
        <section className="mt-20">
          <h2 className="display mb-8 text-3xl sm:text-4xl">{t("p.related")}</h2>
          <div className="rail">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} />)}</div>
        </section>
      )}
    </article>
  );
}
