import { RichText } from "@/components/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ShieldCheck, Truck } from "lucide-react";
import { parseFacts } from "@/lib/facts";
import { splitPet } from "@/lib/petfacts";
import { petIcon } from "@/lib/goal-icon";
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

  const f = splitPet(parseFacts(tr(p.specs, lang)));
  return (
    <article className="mx-auto max-w-7xl px-4 py-6 pb-28 md:py-10 md:pb-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ViewContent id={p.id} value={p.price} currency={s.store.currency} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:text-ink">{t("nav.home")}</Link> / {cat && <><Link href={`/category/${cat.slug}`} className="hover:text-ink">{tr(cat.name, lang)}</Link> / </>}<span className="text-ink">{name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
        <Gallery images={p.images} alt={name} closeLabel={t("cod.close")} />
        <div>
          {f.suitable.length > 0 && <p className="mb-3 flex flex-wrap gap-2"><span className="sr-only">{t("p.suitable")}</span>{f.suitable.map((x) => { const I = petIcon(x); return <Link key={x} href={`/shop?q=${encodeURIComponent(x)}`} className="pill hover:bg-brand hover:text-brand-ink" dir="auto"><I className="size-4 text-[var(--paw)]" />{x}</Link>; })}</p>}
          <h1 className="heading text-[clamp(2rem,4.8vw,3.2rem)]">{name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            {p.rating != null ? <><Star className="size-4 fill-accent text-accent" /><span className="num font-bold text-ink">{p.rating}</span> · {t("p.reviews", { n: p.reviewCount })}</> : t("p.noReviews")}
            <span aria-hidden>·</span>
            <span className={inStock ? "font-semibold text-ok" : "font-semibold text-danger"}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          {(f.stage || f.size) && <p className="mt-4 flex flex-wrap gap-2 text-sm font-bold">{f.stage && <span className="rounded-full border-2 border-line px-3 py-1" dir="auto">{t("p.stage")}: {f.stage}</span>}{f.size && <span className="rounded-full border-2 border-line px-3 py-1" dir="auto">{t("p.size")}: {f.size}</span>}</p>}
          <div className="mt-6 border-t-2 border-dashed border-line pt-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <ul className="mt-5 space-y-2 text-sm font-semibold">
            <li className="flex items-center gap-2.5 rounded-full bg-sunken p-2.5 pe-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-brand"><Truck className="size-4" /></span>{t("p.heavy")}</li>
            <li className="flex items-center gap-2.5 rounded-full bg-sunken p-2.5 pe-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-brand"><ShieldCheck className="size-4" /></span>{t("p.petSafe")}</li>
          </ul>
        </div>
      </div>

      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {tr(p.longDesc, lang) && <div className="card border-2 p-6 sm:p-8"><h2 className="heading mb-3 text-2xl">{t("p.description")}</h2><RichText html={tr(p.longDesc, lang)} className="prose-lite text-muted" /></div>}
          {(f.ingredients || f.care || f.rest.length > 0) && (
            <div className="card divide-y-2 divide-line border-2 p-6 sm:p-8">
              {f.ingredients && <div className="pb-4"><h3 className="heading mb-1 text-lg">{t("p.ingredients")}</h3><p className="text-sm text-muted" dir="auto">{f.ingredients}</p></div>}
              {f.rest.map((r, i) => <div key={i} className="flex justify-between gap-4 py-3 text-sm"><b>{r.label}</b><span className="text-end text-muted" dir="auto">{r.value}</span></div>)}
              {f.care && <div className="pt-4"><h3 className="heading mb-1 text-lg">{t("p.care")}</h3><p className="text-sm text-muted" dir="auto">{f.care}</p></div>}
            </div>
          )}
        </div>
        {f.feeding.length > 0 && (
          <div className="card h-fit border-2 p-6 sm:p-8">
            <h2 className="heading mb-2 text-2xl">{t("p.feeding")}</h2>
            <p className="mb-4 text-sm text-muted">{t("p.feedingD")}</p>
            <table className="feed-table"><thead><tr><th>{t("p.petWeight")}</th><th>{t("p.dailyAmount")}</th></tr></thead><tbody>{f.feeding.map((r, i) => <tr key={i}><td dir="auto">{r.weight}</td><td dir="auto">{r.amount}</td></tr>)}</tbody></table>
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
