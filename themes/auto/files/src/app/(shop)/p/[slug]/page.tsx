import { RichText } from "@/components/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Wrench, ShieldCheck } from "lucide-react";
import { parseFacts } from "@/lib/facts";
import { fitList } from "@/lib/fitment";
import { FitCheck } from "@/features/catalog/components/car-select";
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

  const facts = parseFacts(tr(p.specs, lang)).filter((f) => f.value);
  const compat = facts.find((f) => /^(compatibility|compatibilité|التوافق)$/i.test(f.label));
  const list = fitList(compat?.value);
  const rest = facts.filter((f) => f !== compat);
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
          {p.sku && <p className="chip mb-3">SKU {p.sku}</p>}
          <h1 className="heading text-[clamp(1.9rem,4.6vw,3rem)]">{name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            {p.rating != null ? <><Star className="size-4 fill-accent text-accent" /><span className="num font-bold text-ink">{p.rating}</span> · {t("p.reviews", { n: p.reviewCount })}</> : t("p.noReviews")}
            <span aria-hidden>·</span>
            <span className={inStock ? "font-semibold text-ok" : "font-semibold text-danger"}>{inStock ? t("p.inStock") : t("p.soldOut")}</span>
          </p>
          <p className="mt-4 leading-relaxed text-muted">{tr(p.shortDesc, lang)}</p>
          {compat && <div className="mt-5"><FitCheck text={compat.value} labels={{ title: t("p.fitCheck"), make: t("home.make"), model: t("home.model"), all: t("home.allModels"), pick: t("p.fitPick"), yes: t("p.fitYes", { car: "{car}" }), no: t("p.fitNo", { car: "{car}" }), universal: t("p.fitUniversal"), saved: t("p.carSaved") }} /></div>}
          <div className="mt-6 border-t border-line pt-6">
            <ProductBuy
              autoOpen={sp.order === "1"}
              product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAt: p.compareAt, stock: p.stock, trackStock: p.trackStock, variants: p.variants, image: p.images[0]?.key ?? null }}
              bundles={bundles}
              cities={cities}
            />
          </div>
          <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-sunken p-3 text-sm font-semibold"><ShieldCheck className="size-5 shrink-0 text-brand" />{t("p.fitExchange")}</p>
        </div>
      </div>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {tr(p.longDesc, lang) && (
            <div><h2 className="heading mb-3 text-2xl">{t("p.description")}</h2><RichText html={tr(p.longDesc, lang)} className="prose-lite text-muted" /></div>
          )}
          {rest.length > 0 && (
            <div><h2 className="heading mb-3 flex items-center gap-2 text-2xl"><Wrench className="size-5 text-brand" />{t("p.specs")}</h2>
              <div className="overflow-hidden rounded-xl border border-line"><table className="spec-table"><tbody>{rest.map((f, i) => <tr key={i}><th scope="row">{f.label}</th><td dir="auto">{f.value}</td></tr>)}</tbody></table></div>
            </div>
          )}
        </div>
        {list.length > 0 && (
          <aside className="carbon h-fit rounded-xl p-5">
            <h2 className="heading relative mb-3 text-xl">{t("p.compat")}</h2>
            <ul className="relative grid gap-1.5 text-sm">{list.map((x) => <li key={x} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--brand)]" /><Link href={`/shop?q=${encodeURIComponent(x)}`} className="hover:underline">{x}</Link></li>)}</ul>
          </aside>
        )}
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-[1fr_22rem]" aria-labelledby="reviews-h">
        <div>
          <h2 id="reviews-h" className="heading mb-4 text-2xl">{t("p.reviews", { n: p.reviewCount })}</h2>
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
          <h2 className="heading mb-6 text-2xl">{t("p.related")}</h2>
          <div className="rail">{related.items.map((r) => <ProductCard key={r.id} p={r} lang={lang} t={t} currency={s.store.currency} codMode={s.checkout.codMode} />)}</div>
        </section>
      )}
    </article>
  );
}
