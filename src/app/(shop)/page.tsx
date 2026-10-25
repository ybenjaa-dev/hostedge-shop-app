import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";

const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };

export default async function Home() {
  const s = await getSettings();
  const { lang, t } = await getT();
  const [cats, featured, best, reviews] = await Promise.all([
    listCategories(),
    listProducts({ featured: true, perPage: 8 }),
    listProducts({ bestsellers: true, perPage: 8 }),
    listReviews({ limit: 6 }),
  ]);
  const cur = s.store.currency;
  const sections = s.home.sections.filter((x) => x.visible);

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} />;
      case "trust":
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-8">
            <ul className="grid gap-3 sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" aria-hidden /></span>
                    <span><span className="block font-bold">{tr(b.title, lang)}</span><span className="text-sm text-muted">{tr(b.text, lang)}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-10">
            <SectionTitle title={t("home.categories")} />
            <div className="scroll-snap-x -mx-4 flex gap-3 px-4 [&>*]:!flex-none [&>*]:!basis-auto md:grid md:grid-cols-4 md:overflow-visible">
              {cats.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="group relative block aspect-[4/3] w-44 overflow-hidden rounded-2xl bg-sunken md:w-auto">
                  {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="display absolute inset-x-3 bottom-3 text-lg font-extrabold leading-tight text-white">{tr(c.name, lang)}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      case "featured":
        return products(id, t("home.featured"), featured.items);
      case "bestsellers":
        return products(id, t("home.bestsellers"), best.items);
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-8">
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/6] min-h-40 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/60 to-transparent p-6 text-white rtl:bg-gradient-to-l md:p-12">
                <span className="display text-2xl font-extrabold md:text-4xl">{tr(s.home.banner.title, lang)}</span>
                <span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span>
              </span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-10">
            <SectionTitle title={t("home.reviews")} />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card p-5">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-accent text-accent" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-3 text-sm font-semibold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
    }
    return null;
  };

  function products(id: string, title: string, items: typeof featured.items) {
    if (!items.length) return null;
    return (
      <section key={id} className="mx-auto max-w-7xl px-4 py-10">
        <SectionTitle title={title} href="/shop" more={t("home.viewAll")} />
        <ProductGrid>{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</ProductGrid>
      </section>
    );
  }

  return <>{sections.map((x) => render(x.id))}</>;
}

function SectionTitle({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="display text-2xl font-extrabold sm:text-3xl">{title}</h2>
      {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: "ar" | "fr" | "en"; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const slides = s.hero.slides;
  if (!slides.length) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-brand px-6 py-16 text-brand-ink md:px-14 md:py-28">
          <h1 className="display max-w-2xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{s.store.name}</h1>
          <p className="mt-4 max-w-md text-lg opacity-90">{tr(s.store.tagline, lang)}</p>
          <Link href="/shop" className="btn btn-accent btn-lg mt-8">{t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
        </div>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-7xl px-0 pt-0 sm:px-4 sm:pt-4" aria-roledescription="carousel">
      <div className="scroll-snap-x flex gap-0 sm:gap-3 sm:rounded-3xl">
        {slides.map((sl, i) => (
          <div key={i} className="relative min-h-[26rem] overflow-hidden bg-secondary sm:rounded-3xl md:min-h-[34rem]" aria-roledescription="slide">
            {sl.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5 ltr:md:bg-gradient-to-r rtl:md:bg-gradient-to-l" />
            <div className="relative flex min-h-[26rem] flex-col justify-end p-6 text-white md:min-h-[34rem] md:max-w-2xl md:justify-center md:p-14">
              {i === 0 ? <h1 className="display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">{tr(sl.title, lang)}</h1> : <h2 className="display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">{tr(sl.title, lang)}</h2>}
              <p className="mt-3 max-w-md text-base opacity-90 md:text-lg">{tr(sl.sub, lang)}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-accent btn-lg">{tr(sl.cta, lang)} <ArrowRight className="size-5 rtl:rotate-180" /></Link>}
                {sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border-white/50 bg-white/10 text-white backdrop-blur hover:bg-white/20">{tr(sl.cta2, lang)}</Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
