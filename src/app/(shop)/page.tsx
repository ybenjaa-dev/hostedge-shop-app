import Link from "next/link";
import { ArrowLeft, ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";

const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };
const OCT = "[clip-path:polygon(30%_0,70%_0,100%_30%,100%_70%,70%_100%,30%_100%,0_70%,0_30%)]";

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
  const codMode = s.checkout.codMode;

  const rail = (id: string, title: string, items: typeof featured.items, ranked = false) =>
    items.length ? (
      <section key={id} className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <Heading title={title} href="/shop" more={t("home.viewAll")} lang={lang} />
        <div className="rail">
          {items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={ranked ? i + 1 : undefined} />)}
        </div>
      </section>
    ) : null;

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} />;
      case "trust":
        return (
          <section key={id} className="bg-zel border-y border-gold bg-sunken/60">
            <ul className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex flex-col items-center text-center">
                    <span className={`grid size-16 place-items-center bg-gold p-[2px] ${OCT}`}><span className={`grid size-full place-items-center bg-surface text-brand ${OCT}`}><Icon className="size-7" strokeWidth={1.6} aria-hidden /></span></span>
                    <span className="heading mt-3 text-xl">{tr(b.title, lang)}</span>
                    <span className="text-sm text-muted">{tr(b.text, lang)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-10 md:py-14">
            <Heading title={t("home.categories")} lang={lang} />
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10">
              {cats.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="group flex w-[7.5rem] flex-col items-center text-center sm:w-40">
                  <span className="frame arch block aspect-[3/4] w-full overflow-hidden bg-sunken p-[5px] transition group-hover:-translate-y-1">
                    <span className="arch block size-full overflow-hidden bg-sunken">
                      {c.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-110" /> : <span className="bg-zel block size-full" />}
                    </span>
                  </span>
                  <span className="heading mt-3 text-xl leading-tight group-hover:text-brand">{tr(c.name, lang)}</span>
                  <span className="num text-xs text-muted">{c.count}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      case "featured":
        return rail(id, t("home.featured"), featured.items);
      case "bestsellers":
        return rail(id, t("home.bestsellers"), best.items, true);
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-8">
            <Link href={s.home.banner.href || "/shop"} className="frame relative block overflow-hidden rounded-[1.25rem] p-[6px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/7] min-h-44 w-full rounded-[1rem] object-cover" />
              <span className="absolute inset-[6px] flex flex-col items-center justify-center rounded-[1rem] bg-navy/55 p-6 text-center text-[#f6efd9]">
                <span className="heading text-3xl md:text-5xl">{tr(s.home.banner.title, lang)}</span>
                <span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span>
              </span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="bg-zel border-y border-gold bg-sunken/50 py-10 md:py-14">
            <div className="mx-auto max-w-7xl px-4">
              <Heading title={t("home.reviews")} lang={lang} />
              <div className="grid gap-5 md:grid-cols-3">
                {reviews.slice(0, 3).map((r) => (
                  <figure key={r.id} className="card p-6 text-center">
                    <span className="heading block text-5xl leading-none text-gold">“</span>
                    <blockquote className="mt-1 text-lg leading-relaxed">{r.body}</blockquote>
                    <div className="mt-3 flex justify-center gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-gold text-gold" : "text-line"}`} />)}</div>
                    <figcaption className="heading mt-2 text-lg">{r.name}{r.city && <span className="font-sans text-sm font-normal text-muted"> · {r.city}</span>}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        );
    }
    return null;
  };

  const sections = s.home.sections.filter((x) => x.visible);
  const heroIdx = sections.findIndex((x) => x.id === "hero");
  const nodes = sections.map((x) => render(x.id));
  nodes.splice(Math.max(0, heroIdx + 2), 0, <HowItWorks key="how" t={t} codMode={codMode} lang={lang} />);
  return <>{nodes}</>;
}

function Heading({ title, href, more, lang }: { title: string; href?: string; more?: string; lang: Lang }) {
  const Arrow = dirOf(lang) === "rtl" ? ArrowLeft : ArrowRight;
  return (
    <div className="mb-8 text-center">
      <div className="rule mx-auto max-w-md"><span className="orn" /></div>
      <h2 className="heading mt-3 text-3xl sm:text-5xl">{title}</h2>
      {href && <Link href={href} className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand underline-offset-4 hover:underline">{more} <Arrow className="size-4" /></Link>}
    </div>
  );
}

function HowItWorks({ t, codMode, lang }: { t: TFn; codMode: boolean; lang: Lang }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <Heading title={t("how.title")} lang={lang} />
      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
        <span aria-hidden className="absolute inset-x-[16%] top-9 hidden border-t-2 border-dashed border-gold md:block" />
        {steps.map(([title, text], i) => (
          <li key={i} className="relative text-center">
            <span className={`mx-auto grid size-[4.5rem] place-items-center bg-gold p-[2px] ${OCT}`}><span className={`heading num grid size-full place-items-center bg-navy text-3xl text-[#e3c36f] ${OCT}`}>{i + 1}</span></span>
            <h3 className="heading mt-4 text-2xl">{title}</h3>
            <p className="mx-auto mt-1 max-w-xs text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Hero({ s, lang, t }: { s: Settings; lang: Lang; t: TFn }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="bg-zel relative overflow-hidden border-b border-gold" aria-roledescription="carousel">
      <div className="scroll-snap-x flex">
        {slides.map((sl, i) => (
          <div key={i} className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 md:grid-cols-2 md:gap-14 md:py-14" aria-roledescription="slide">
            <div className="order-2 text-center md:order-1 md:text-start">
              <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gold-ink"><span className="orn !size-3.5" aria-hidden />{t("cod.payOnDelivery")}<span className="orn !size-3.5" aria-hidden /></p>
              {i === 0 ? (
                <h1 className="display break-words text-[clamp(2.4rem,7.5vw,4.6rem)] text-balance">{tr(sl.title, lang)}</h1>
              ) : (
                <h2 className="display break-words text-[clamp(2.4rem,7.5vw,4.6rem)] text-balance">{tr(sl.title, lang)}</h2>
              )}
              <p className="mx-auto mt-4 max-w-md text-lg text-muted md:mx-0">{tr(sl.sub, lang)}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary btn-lg px-8">{tr(sl.cta, lang)}</Link>}
                {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg">{tr(sl.cta2, lang)}</Link>}
              </div>
            </div>
            <div className="order-1 mx-auto w-full max-w-[19rem] md:order-2 md:max-w-sm">
              <div className="frame arch float relative aspect-[3/4] bg-sunken p-[8px]">
                <div className="arch relative size-full overflow-hidden bg-sunken">
                  {sl.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                  ) : (
                    <div className="bg-zel absolute inset-0 grid place-items-center bg-brand-soft"><span className="orn !size-24" /></div>
                  )}
                </div>
                <span className={`absolute -bottom-3 start-1/2 grid h-14 w-28 -translate-x-1/2 place-items-center bg-gold px-2 text-center text-[0.72rem] font-extrabold leading-tight text-navy [clip-path:polygon(8%_0,92%_0,100%_50%,92%_100%,8%_100%,0_50%)] rtl:translate-x-1/2`}>{t("cod.payOnDelivery")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
