import Link from "next/link";
import { ArrowRight, ArrowLeft, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";

const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };
const W = "mx-auto max-w-[90rem] px-4 sm:px-8";

function Heading({ kicker, title, sub, href, cta, Arrow }: { kicker?: string; title: string; sub?: string; href?: string; cta?: string; Arrow: typeof ArrowRight }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <p className="kicker mb-2">{kicker}</p>}
        <h2 className="display text-[clamp(2.4rem,6vw,4.5rem)]">{title}</h2>
        {sub && <p className="mt-2 max-w-md text-muted">{sub}</p>}
      </div>
      {href && cta && <Link href={href} className="btn btn-outline btn-sm">{cta}<Arrow className="size-4" aria-hidden /></Link>}
    </div>
  );
}

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
  const Arrow = dirOf(lang) === "rtl" ? ArrowLeft : ArrowRight;

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <HeroBlock key={id} s={s} lang={lang} t={t} Arrow={Arrow} />;
      case "trust":
        return (
          <section key={id} className="border-y border-line bg-surface">
            <div className={`${W} grid divide-line sm:grid-cols-3 sm:divide-x rtl:sm:divide-x-reverse`}>
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <div key={i} className="flex items-center gap-4 py-5 sm:px-6 first:sm:ps-0">
                    <span className="skew lime grid size-12 shrink-0 place-items-center"><Icon className="size-6" strokeWidth={2} aria-hidden /></span>
                    <div><p className="display text-xl">{tr(b.title, lang)}</p><p className="text-sm text-muted">{tr(b.text, lang)}</p></div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="pt-14 sm:pt-20">
            <div className={W}><Heading kicker={t("sp.explore")} title={t("home.categories")} Arrow={Arrow} /></div>
            <div className="shelf !ps-4 sm:!ps-8" aria-label={t("home.categories")}>
              {cats.map((c, i) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="tile group !flex-none" style={{ flexBasis: "min(68vw, 19rem)" }}>
                  <span className="tile-media !aspect-[3/4]">
                    {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <span className="display outline-text absolute end-3 top-1 text-7xl" style={{ ["--stroke" as string]: "#fff" }}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <span className="display block text-4xl">{tr(c.name, lang)}</span>
                      <span className="mt-1 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[var(--brand)]"><span className="num">{c.count} · {t("sp.explore")}</span><Arrow className="size-5 transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" aria-hidden /></span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      case "featured":
        if (!featured.items.length) return null;
        return (
          <section key={id} className={`${W} pt-6 sm:pt-12`}>
            <Heading kicker={t("home.featured")} title={t("sp.drops")} sub={t("sp.dropsSub")} href="/shop" cta={t("home.viewAll")} Arrow={Arrow} />
            <ProductGrid bento>
              {featured.items.slice(0, 7).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} big={i === 0} priority={i < 2} />)}
            </ProductGrid>
          </section>
        );
      case "bestsellers":
        if (!best.items.length) return null;
        return (
          <section key={id} className="slant mt-14 bg-surface sm:mt-20">
            <div className={W}><Heading kicker={t("home.bestsellers")} title={t("sp.rank")} href="/shop" cta={t("home.viewAll")} Arrow={Arrow} /></div>
            <div className="shelf !ps-4 sm:!ps-8">
              {best.items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={i + 1} />)}
            </div>
          </section>
        );
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className={`${W} pt-14`}>
            <Link href={s.home.banner.href || "/shop"} className="tile relative block overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/6] min-h-44 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/80 to-transparent p-6 text-white rtl:bg-gradient-to-l md:p-12"><span className="display text-4xl md:text-7xl">{tr(s.home.banner.title, lang)}</span><span className="mt-2 max-w-md">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className={`${W} pt-14 sm:pt-20`}>
            <Heading title={t("home.reviews")} Arrow={Arrow} />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r, i) => (
                <figure key={r.id} className={`relative bg-surface p-6 ${i === 1 ? "md:-translate-y-4" : ""}`}>
                  <span aria-hidden className="display absolute end-4 top-0 text-8xl text-[var(--brand)] opacity-30">”</span>
                  <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-[var(--brand)] text-[var(--brand)]" : "text-rule"}`} />)}</div>
                  <blockquote className="mt-3 text-lg leading-snug">{r.body}</blockquote>
                  <figcaption className="mt-4 text-xs font-black uppercase tracking-widest">{r.name}{r.city && <span className="font-medium text-muted"> — {r.city}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
    }
    return null;
  };

  const sections = s.home.sections.filter((x) => x.visible);
  const heroIdx = sections.findIndex((x) => x.id === "hero");
  const nodes = sections.map((x) => render(x.id));
  nodes.splice(Math.max(0, heroIdx + 1 + 2), 0, <HowItWorks key="how" t={t} codMode={codMode} />);
  return <div className="pb-6">{nodes}</div>;
}

function HowItWorks({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className="lime slant mt-14 sm:mt-20">
      <div className={W}>
        <h2 className="display mb-8 text-[clamp(2.4rem,6vw,4.5rem)]">{t("how.title")}</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={i} className="relative border-t-4 border-black pt-3">
              <span className="display outline-text block text-8xl" style={{ ["--stroke" as string]: "#0b0b0d" }}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display text-3xl">{title}</h3><p className="mt-1 max-w-xs font-medium">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Kinetic opening: oversized outlined wordmark, stacked headline with a lime last word, diagonal product cutout. */
function HeroBlock({ s, lang, t, Arrow }: { s: Settings; lang: Lang; t: TFn; Arrow: typeof ArrowRight }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section aria-roledescription="carousel" className="scroll-snap-x flex overflow-y-hidden">
      {slides.map((sl, i) => {
        const words = tr(sl.title, lang).trim().split(/\s+/);
        const last = words.length > 1 ? words.pop() : "";
        const head = words.join(" ");
        const H = i === 0 ? "h1" : "h2";
        return (
          <div key={i} className="relative isolate min-h-[34rem] overflow-hidden bg-bg lg:min-h-[40rem]" aria-roledescription="slide">
            <p aria-hidden dir="auto" className="display outline-text pointer-events-none absolute -top-4 start-0 -z-10 select-none whitespace-nowrap text-[clamp(8rem,30vw,28rem)] leading-[0.8] opacity-60" style={{ ["--stroke" as string]: "var(--line)" }}>{s.store.name}</p>
            <div className={`${W} grid items-center gap-4 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-16`}>
              <div className="relative z-10">
                <p className="kicker mb-4">{t("sp.heroKicker")}</p>
                <H className="display text-[clamp(3.6rem,12vw,10rem)]">
                  {head}{last && <> <span className="text-[var(--brand)]">{last}</span></>}
                </H>
                <p className="mt-5 max-w-md text-lg text-muted">{tr(sl.sub, lang)}</p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary btn-lg px-8">{tr(sl.cta, lang)}<Arrow className="size-5" aria-hidden /></Link>}
                  {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg px-8">{tr(sl.cta2, lang)}</Link>}
                  <span className="skew border-2 border-[var(--ink)] px-3 py-1 text-xs font-black uppercase tracking-widest"><span>{t("cod.payOnDelivery")}</span></span>
                </div>
              </div>
              <div className="relative -mx-4 h-[22rem] sm:-mx-8 lg:mx-0 lg:h-[34rem]">
                <div className="lime absolute inset-0 [clip-path:polygon(16%_0,100%_0,84%_100%,0_100%)] rtl:[clip-path:polygon(0_0,84%_0,100%_100%,16%_100%)]" />
                <div className="absolute inset-[6%] [clip-path:polygon(16%_0,100%_0,84%_100%,0_100%)] rtl:[clip-path:polygon(0_0,84%_0,100%_100%,16%_100%)]" style={{ background: "repeating-linear-gradient(115deg, transparent 0 18px, rgba(0,0,0,.07) 18px 20px)" }} />
                {sl.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="drift absolute inset-0 m-auto size-[96%] object-contain drop-shadow-[0_30px_30px_rgba(0,0,0,.45)]" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
