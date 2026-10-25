import Link from "next/link";
import { ArrowRight, ArrowLeft, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Sparkles } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews, type ProductCard as PC } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";
import { Money } from "@/components/money";

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
  const codMode = s.checkout.codMode;
  const catName = new Map(cats.map((c) => [c.id, tr(c.name, lang)]));
  const Arrow = dirOf(lang) === "rtl" ? ArrowLeft : ArrowRight;

  const rail = (id: string, title: string, items: PC[], ranked = false) =>
    items.length ? (
      <section key={id} className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <Heading title={title} href="/shop" more={t("home.viewAll")} Arrow={Arrow} />
        <div className="rail">{items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={ranked ? i + 1 : undefined} eyebrow={p.categoryId ? catName.get(p.categoryId) : undefined} />)}</div>
      </section>
    ) : null;

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} pick={featured.items.find((p) => p.inStock) ?? featured.items[0]} cur={cur} codMode={codMode} Arrow={Arrow} />;
      case "trust":
        return (
          <section key={id} className="mx-auto max-w-5xl px-4 pb-4 pt-2">
            <ul className="grid gap-4 rounded-[2rem] border border-line bg-surface/70 p-5 sm:grid-cols-3 sm:p-6">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? Sparkles;
                return (
                  <li key={i} className="flex items-center gap-3.5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Icon className="size-5" strokeWidth={1.5} aria-hidden /></span>
                    <span><span className="block font-semibold leading-tight">{tr(b.title, lang)}</span><span className="text-sm text-muted">{tr(b.text, lang)}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-12 md:py-16">
            <Heading title={t("home.concern")} />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-5">
              {cats.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-sunken">
                  {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover transition duration-[900ms] group-hover:scale-105" />}
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-surface/90 px-4 py-2.5 backdrop-blur"><span className="display text-lg leading-none">{tr(c.name, lang)}</span><span className="num text-xs text-muted">{c.count}</span></span>
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
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden rounded-[2rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/7] min-h-44 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col items-center justify-center bg-[#2b1219]/35 p-6 text-center text-white"><span className="display text-3xl md:text-5xl">{tr(s.home.banner.title, lang)}</span><span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-12 md:py-16">
            <Heading title={t("home.reviews")} />
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card p-6">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-rose text-rose" : "text-line"}`} />)}</div>
                  <blockquote className="display mt-3 text-[1.3rem] leading-snug">“{r.body}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 text-sm"><span className="grid size-9 place-items-center rounded-full bg-brand-soft font-bold text-brand">{r.name.slice(0, 1)}</span><span><b>{r.name}</b>{r.city && <span className="block text-muted">{r.city}</span>}</span></figcaption>
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
  nodes.splice(Math.max(0, heroIdx + 3), 0, <Ritual key="ritual" t={t} codMode={codMode} />);
  return <>{nodes}</>;
}

function Heading({ title, href, more, Arrow }: { title: string; href?: string; more?: string; Arrow?: typeof ArrowRight }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
      <h2 className="display text-[2rem] sm:text-5xl">{title}</h2>
      {href && Arrow && <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 border-b border-ink pb-0.5 text-sm font-semibold hover:border-brand hover:text-brand">{more}<Arrow className="size-4" /></Link>}
    </div>
  );
}

function Ritual({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="rounded-[2.5rem] bg-sunken px-6 py-12 md:px-14">
        <p className="eyebrow text-center">{t("p.ritual")}</p>
        <h2 className="display mt-2 text-center text-[2rem] sm:text-5xl">{t("how.title")}</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={i} className="text-center">
              <span className="display num block text-6xl leading-none text-brand/30">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="display mt-3 text-2xl">{title}</h3>
              <p className="mx-auto mt-1 max-w-xs text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Hero({ s, lang, t, pick, cur, codMode, Arrow }: { s: Settings; lang: Lang; t: TFn; pick?: PC; cur: string; codMode: boolean; Arrow: typeof ArrowRight }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="relative overflow-hidden" aria-roledescription="carousel">
      <span className="blob -start-24 top-10 size-72 bg-rose/35" aria-hidden /><span className="blob -end-16 bottom-0 size-80 bg-brand/15" aria-hidden />
      <div className="scroll-snap-x relative flex">
        {slides.map((sl, i) => (
          <div key={i} className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-10 md:grid-cols-[1.05fr_1fr] md:gap-14 md:py-16" aria-roledescription="slide">
            <div className="order-2 text-center md:order-1 md:text-start">
              <p className="eyebrow inline-flex items-center gap-2"><Sparkles className="size-3.5 text-rose" aria-hidden />{t("cod.payOnDelivery")}</p>
              {i === 0 ? <h1 className="display mt-4 text-balance text-[clamp(2.8rem,8.5vw,6rem)]">{tr(sl.title, lang)}</h1> : <h2 className="display mt-4 text-balance text-[clamp(2.8rem,8.5vw,6rem)]">{tr(sl.title, lang)}</h2>}
              <p className="mx-auto mt-5 max-w-md text-lg text-muted md:mx-0">{tr(sl.sub, lang)}</p>
              <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary btn-lg px-8">{tr(sl.cta, lang)}<Arrow className="size-5" /></Link>}
                {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg">{tr(sl.cta2, lang)}</Link>}
              </div>
            </div>
            <div className="relative order-1 mx-auto w-full max-w-sm md:order-2 md:max-w-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-sunken shadow-[0_40px_70px_-40px_rgba(90,40,60,.6)]">
                {sl.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                ) : <div className="absolute inset-0 bg-gradient-to-br from-rose/40 to-brand/30" />}
              </div>
              {i === 0 && pick && (
                <Link href={`/p/${pick.slug}`} className="absolute -bottom-5 start-3 flex max-w-[16.5rem] items-center gap-3 rounded-[1.4rem] border border-line bg-surface/90 p-2.5 pe-4 shadow-xl backdrop-blur sm:-start-6">
                  <span className="size-14 shrink-0 overflow-hidden rounded-2xl bg-sunken">{pick.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(pick.image)} alt="" className="size-full object-cover" />}</span>
                  <span className="min-w-0"><span className="eyebrow block !text-[0.62rem]">{t("p.pickedFor")}</span><span className="display block truncate text-base leading-tight">{tr(pick.name, lang)}</span><Money amount={pick.minPrice} currency={cur} lang={lang} className="text-sm font-bold text-brand" />{codMode ? "" : ""}</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
