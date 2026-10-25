import Link from "next/link";
import { ArrowRight, ArrowLeft, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, ListChecks, Plus, MousePointerClick, PhoneCall, HandCoins } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { goalIcon } from "@/lib/goal-icon";
import type { TFn, DictKey } from "@/lib/dict";
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
      <section key={id} className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <Heading title={title} href="/shop" more={t("home.viewAll")} Arrow={Arrow} />
        <div className="rail">{items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={ranked ? i + 1 : undefined} eyebrow={p.categoryId ? catName.get(p.categoryId) : undefined} />)}</div>
      </section>
    ) : null;

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} pick={featured.items.find((p) => p.inStock) ?? featured.items[0]} cur={cur} Arrow={Arrow} />;
      case "trust":
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 pt-6">
            <ul className="grid gap-3 sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-brand"><Icon className="size-5" aria-hidden /></span>
                    <span><span className="block font-bold leading-tight">{tr(b.title, lang)}</span><span className="text-sm text-muted">{tr(b.text, lang)}</span></span>
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
            <Heading title={t("goal.title")} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cats.map((c) => {
                const Icon = goalIcon(`${c.slug} ${tr(c.name, "en")} ${tr(c.name, lang)}`);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className="group flex flex-col items-center gap-3 rounded-[1.5rem] border border-line bg-surface p-5 text-center transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_16px_30px_-22px_rgba(12,59,42,.6)]">
                    <span className="grid size-16 place-items-center rounded-full bg-accent text-secondary transition group-hover:scale-110"><Icon className="size-7" strokeWidth={2.2} aria-hidden /></span>
                    <span className="font-extrabold leading-tight">{tr(c.name, lang)}</span>
                    <span className="num text-xs text-muted">{c.count}</span>
                  </Link>
                );
              })}
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
              <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-secondary/85 to-transparent p-6 text-white md:p-10"><span className="display text-3xl md:text-5xl">{tr(s.home.banner.title, lang)}</span><span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-10 md:py-14">
            <Heading title={t("home.reviews")} />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card p-5">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-[#f5b301] text-[#f5b301]" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 text-[1.02rem] leading-relaxed">{r.body}</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 text-sm"><span className="grid size-9 place-items-center rounded-full bg-mint font-extrabold text-brand">{r.name.slice(0, 1)}</span><span><b>{r.name}</b>{r.city && <span className="block text-muted">{r.city}</span>}</span></figcaption>
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
  nodes.splice(Math.max(0, heroIdx + 3), 0, <Steps key="steps" t={t} codMode={codMode} />, <Transparency key="clear" t={t} />);
  nodes.push(<Faq key="faq" t={t} />);
  return <>{nodes}</>;
}

function Heading({ title, href, more, Arrow }: { title: string; href?: string; more?: string; Arrow?: typeof ArrowRight }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <h2 className="display text-[1.9rem] sm:text-5xl">{title}</h2>
      {href && Arrow && <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-white hover:bg-brand">{more}<Arrow className="size-4" /></Link>}
    </div>
  );
}

function Steps({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[MousePointerClick, t("how.s1"), t("how.s1d")], [PhoneCall, t("how.s2"), t("how.s2d")], [HandCoins, t("how.s3"), t("how.s3d")]] as const;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <Heading title={t("how.title")} />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(([Icon, title, text], i) => (
          <li key={i} className="relative overflow-hidden rounded-[1.75rem] bg-mint p-6">
            <span className="display num absolute -end-1 -top-3 text-[6.5rem] font-extrabold leading-none text-brand/10">{i + 1}</span>
            <span className="relative grid size-12 place-items-center rounded-2xl bg-secondary text-accent"><Icon className="size-6" aria-hidden /></span>
            <h3 className="relative mt-4 text-xl font-extrabold">{title}</h3>
            <p className="relative mt-1 text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Transparency({ t }: { t: TFn }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col items-start gap-4 rounded-[2rem] bg-secondary p-7 text-white md:flex-row md:items-center md:justify-between md:p-10">
        <div className="flex items-start gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-secondary"><ListChecks className="size-7" aria-hidden /></span><div><h2 className="display text-2xl sm:text-3xl">{t("home.clear")}</h2><p className="mt-1 max-w-xl text-white/75">{t("home.clearD")}</p></div></div>
        <Link href="/shop" className="btn btn-accent shrink-0">{t("home.shopNow")}</Link>
      </div>
    </section>
  );
}

function Faq({ t }: { t: TFn }) {
  const items = [1, 2, 3, 4].map((n) => [t(`faq.q${n}` as DictKey), t(`faq.a${n}` as DictKey)] as const);
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h2 className="display mb-6 text-center text-[1.9rem] sm:text-5xl">{t("faq.title")}</h2>
      <div className="space-y-3">
        {items.map(([q, a], i) => (
          <details key={i} className="group rounded-2xl border border-line bg-surface px-5 py-4 open:border-brand">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">{q}<Plus className="size-5 shrink-0 text-brand transition group-open:rotate-45" aria-hidden /></summary>
            <p className="mt-2 text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Hero({ s, lang, t, pick, cur, Arrow }: { s: Settings; lang: Lang; t: TFn; pick?: PC; cur: string; Arrow: typeof ArrowRight }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 sm:pt-4" aria-roledescription="carousel">
      <div className="scroll-snap-x flex gap-3">
        {slides.map((sl, i) => (
          <div key={i} className="relative grid items-center gap-6 overflow-hidden rounded-[2rem] bg-secondary p-6 text-white sm:p-10 md:grid-cols-[1.1fr_1fr] md:gap-10 md:p-14" aria-roledescription="slide">
            <svg aria-hidden viewBox="0 0 400 400" className="pointer-events-none absolute -bottom-24 -end-20 size-[28rem] text-white/[0.05]"><circle cx="200" cy="200" r="190" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="200" cy="200" r="130" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="200" cy="200" r="70" fill="currentColor" /></svg>
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-secondary"><Banknote className="size-4" aria-hidden />{t("cod.payOnDelivery")}</p>
              {i === 0 ? <h1 className="display mt-5 text-balance text-[clamp(2.7rem,8vw,5.4rem)]">{tr(sl.title, lang)}</h1> : <h2 className="display mt-5 text-balance text-[clamp(2.7rem,8vw,5.4rem)]">{tr(sl.title, lang)}</h2>}
              <p className="mt-4 max-w-md text-lg text-white/75">{tr(sl.sub, lang)}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-accent btn-lg px-7">{tr(sl.cta, lang)}<Arrow className="size-5" /></Link>}
                {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border-white/40 bg-transparent text-white hover:bg-white/10">{tr(sl.cta2, lang)}</Link>}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[22rem] md:max-w-md">
              <div className="float6 relative aspect-square overflow-hidden rounded-full bg-accent p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,.7)]">
                <div className="relative size-full overflow-hidden rounded-full bg-mint">
                  {sl.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                  ) : null}
                </div>
              </div>
              {i === 0 && pick && (
                <Link href={`/p/${pick.slug}`} className="absolute -bottom-3 end-0 flex max-w-[15.5rem] items-center gap-3 rounded-2xl bg-surface p-2.5 pe-4 text-ink shadow-xl sm:-end-4">
                  <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-mint">{pick.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(pick.image)} alt="" className="size-full object-cover" />}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-extrabold leading-tight">{tr(pick.name, lang)}</span><Money amount={pick.minPrice} currency={cur} lang={lang} className="text-sm font-bold text-brand" /></span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
