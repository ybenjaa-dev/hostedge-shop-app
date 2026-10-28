import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductFeature } from "@/features/catalog/components/product-card";

const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

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
  const catName = (id: string | null) => { const c = cats.find((x) => x.id === id); return c ? tr(c.name, lang) : undefined; };

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} />;
      case "trust":
        return (
          <section key={id} aria-label="Services" className="border-y border-line">
            <div className="mx-auto grid max-w-[100rem] divide-y divide-[var(--line)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <div key={i} className="px-6 py-8 text-center">
                    <Icon className="mx-auto size-5 text-brand" strokeWidth={1.2} aria-hidden />
                    <p className="caps mt-3">{tr(b.title, lang)}</p>
                    <p className="mt-1 text-sm text-muted">{tr(b.text, lang)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[100rem] px-6 pt-32 md:px-12 md:pt-44">
            <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-24">
              <div className="lx-reveal">
                <p className="eyebrow">{t("lux.collections")}</p>
                <h2 className="display mt-4 text-5xl md:text-7xl">{t("home.categories")}</h2>
              </div>
              <ul className="border-t border-line">
                {cats.map((c, i) => (
                  <li key={c.id} className="group relative border-b border-line">
                    <Link href={`/category/${c.slug}`} className="flex items-baseline gap-5 py-6 md:gap-10 md:py-9">
                      <span className="lx-num w-8 text-lg italic text-brand">{String(i + 1).padStart(2, "0")}</span>
                      <span className="display flex-1 text-4xl transition-all duration-500 group-hover:translate-x-3 group-hover:text-brand md:text-6xl rtl:group-hover:-translate-x-3">{tr(c.name, lang)}</span>
                      <span className="caps hidden text-[0.62rem] text-muted sm:block">{t("lux.pieces", { n: c.count })}</span>
                      <ArrowRight className="lx-arrow size-5 text-brand" strokeWidth={1.2} aria-hidden />
                    </Link>
                    {c.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="pointer-events-none absolute end-24 top-1/2 z-10 hidden aspect-[4/5] w-44 -translate-y-1/2 scale-95 object-cover opacity-0 shadow-2xl transition-all duration-700 group-hover:scale-100 group-hover:opacity-100 xl:block" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      case "featured":
        if (!featured.items.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[100rem] px-6 pt-32 md:px-12 md:pt-44">
            <div className="lx-reveal mb-16 text-center md:mb-28">
              <div className="lx-ornament mb-6"><i /></div>
              <h2 className="display text-5xl md:text-8xl">{t("lux.signature")}</h2>
            </div>
            <div className="space-y-28 md:space-y-48">
              {featured.items.slice(0, 4).map((p, i) => <ProductFeature key={p.id} p={p} lang={lang} t={t} currency={cur} index={i} categoryName={catName(p.categoryId)} />)}
            </div>
          </section>
        );
      case "bestsellers":
        if (!best.items.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[100rem] px-6 pt-32 md:px-12 md:pt-44">
            <div className="lx-reveal mb-14 flex items-end justify-between gap-6 border-b border-line pb-6">
              <h2 className="display text-4xl md:text-6xl">{t("home.bestsellers")}</h2>
              <Link href="/shop" className="caps lx-link inline-flex shrink-0 items-center gap-3">{t("home.viewAll")}<ArrowRight className="lx-arrow size-4" strokeWidth={1.3} aria-hidden /></Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-4 md:gap-x-10">
              {best.items.slice(0, 4).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} rank={i + 1} />)}
            </div>
          </section>
        );
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto mt-32 max-w-[100rem] px-6 md:px-12">
            <Link href={s.home.banner.href || "/shop"} className="group relative block overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/7] min-h-64 w-full object-cover transition-transform duration-[1600ms] group-hover:scale-105" />
              <span className="absolute inset-0 grid place-content-center bg-black/55 p-6 text-center text-white"><span className="display text-4xl md:text-7xl">{tr(s.home.banner.title, lang)}</span><span className="caps mt-4 text-[0.66rem]">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[100rem] px-6 pt-32 md:px-12 md:pt-44">
            <h2 className="display lx-reveal mb-14 text-center text-4xl md:mb-20 md:text-6xl">{t("home.reviews")}</h2>
            <div className="grid divide-y divide-[var(--line)] border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="px-2 py-12 text-center md:px-10">
                  <p className="text-brand" aria-label={`${r.rating}/5`}>{"✦".repeat(r.rating)}<span className="text-[var(--rule)]">{"✦".repeat(5 - r.rating)}</span></p>
                  <blockquote className="display mt-6 text-2xl italic leading-snug md:text-3xl">“{r.body}”</blockquote>
                  <figcaption className="caps mt-6 text-[0.64rem] text-muted">{r.name}{r.city && <> — {r.city}</>}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
    }
    return null;
  };

  const sections = s.home.sections.filter((x) => x.visible);
  const nodes = sections.map((x) => render(x.id));
  const catIdx = sections.findIndex((x) => x.id === "categories");
  nodes.splice(catIdx >= 0 ? catIdx : Math.min(2, nodes.length), 0, <Manifesto key="manifesto" t={t} />);
  nodes.push(<HowItWorks key="how" t={t} codMode={s.checkout.codMode} />);
  return <div>{nodes}</div>;
}

function Manifesto({ t }: { t: TFn }) {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-32 text-center md:pt-44">
      <div className="lx-ornament lx-reveal mb-10"><i /></div>
      <p className="display lx-reveal text-3xl italic leading-snug md:text-5xl">{t("lux.manifesto")}</p>
    </section>
  );
}

function HowItWorks({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("lux.how.s1"), t("lux.how.s1d")], [t("lux.how.s2"), t("lux.how.s2d")], [t("lux.how.s3"), t("lux.how.s3d")]];
  return (
    <section className="mx-auto max-w-[100rem] px-6 pt-32 md:px-12 md:pt-44">
      <h2 className="eyebrow lx-reveal mb-10 text-center">{t("lux.how.title")}</h2>
      <ol className="grid divide-y divide-[var(--line)] border-y border-line md:grid-cols-3 md:divide-x md:divide-y-0 rtl:md:divide-x-reverse">
        {steps.map(([title, text], i) => (
          <li key={i} className="px-4 py-12 text-center md:px-12">
            <span className="display text-6xl text-brand">{ROMAN[i]}</span>
            <h3 className="caps mt-4">{title}</h3>
            <p className="mx-auto mt-3 max-w-xs text-sm text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Cinematic opening: one large watch on a slow spotlight, title and a single quiet call to action beneath. */
function Hero({ s, lang, t }: { s: Settings; lang: Lang; t: TFn }) {
  const sl = s.hero.slides[0] ?? { image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" };
  return (
    <section className="lx-hero" aria-label={s.store.name}>
      {sl.image && (
        <div className="lx-hero-art lx-fade-slow">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileUrl(sl.image)} alt="" fetchPriority="high" />
        </div>
      )}
      <p className="eyebrow lx-rise" style={{ "--d": "0.6s" } as React.CSSProperties}>{t("lux.eyebrow")}</p>
      <h1 className="display lx-rise mt-5 max-w-4xl text-[2.7rem] md:text-7xl lg:text-[5.5rem]" style={{ "--d": "0.9s" } as React.CSSProperties}>{tr(sl.title, lang)}</h1>
      <p className="lx-rise mt-5 max-w-md text-muted" style={{ "--d": "1.2s" } as React.CSSProperties}>{tr(sl.sub, lang)}</p>
      {tr(sl.cta, lang) && (
        <Link href={sl.href || "/shop"} className="caps lx-link lx-rise mt-9 inline-flex items-center gap-3" style={{ "--d": "1.5s" } as React.CSSProperties}>{tr(sl.cta, lang)}<ArrowRight className="lx-arrow size-4" strokeWidth={1.3} aria-hidden /></Link>
      )}
      <span className="lx-hero-line" aria-hidden />
    </section>
  );
}
