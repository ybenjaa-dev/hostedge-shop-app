import Link from "next/link";
import { ArrowUpRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Quote } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";

const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };
const TILE = ["bg-brand text-brand-ink", "bg-accent text-accent-ink", "bg-[#111] text-white", "bg-sunken text-ink"];

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
        <Heading title={title} href="/shop" more={t("home.viewAll")} />
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
          <section key={id} className="border-y-2 border-ink bg-accent text-accent-ink">
            <ul className="mx-auto grid max-w-7xl divide-y-2 divide-ink sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0 rtl:sm:divide-x-reverse">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3 px-5 py-4">
                    <Icon className="size-8 shrink-0" strokeWidth={2.2} aria-hidden />
                    <span><span className="block text-sm font-extrabold uppercase tracking-wide">{tr(b.title, lang)}</span><span className="text-sm font-medium opacity-80">{tr(b.text, lang)}</span></span>
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
            <Heading title={t("home.categories")} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cats.map((c, i) => (
                <Link key={c.id} href={`/category/${c.slug}`} className={`group relative grid grid-cols-[1fr_8.5rem] items-stretch overflow-hidden border-2 border-ink shadow-[5px_5px_0_var(--ink)] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--ink)] ${TILE[i % TILE.length]}`}>
                  <span className="flex min-h-36 flex-col justify-between p-4">
                    <span className="num text-sm font-extrabold opacity-70">{String(i + 1).padStart(2, "0")}</span>
                    <span><span className="display block text-2xl font-extrabold uppercase leading-none">{tr(c.name, lang)}</span><span className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider">{c.count} <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" /></span></span>
                  </span>
                  <span className="relative border-s-2 border-ink bg-sunken">
                    {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
                  </span>
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
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden border-2 border-ink shadow-[6px_6px_0_var(--ink)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/7] min-h-44 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 to-transparent p-5 text-white md:p-10">
                <span className="display text-3xl font-extrabold uppercase md:text-6xl">{tr(s.home.banner.title, lang)}</span>
                <span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span>
              </span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-10 md:py-14">
            <Heading title={t("home.reviews")} />
            <div className="grid gap-5 md:grid-cols-3">
              {reviews.slice(0, 3).map((r, i) => (
                <figure key={r.id} className={`relative border-2 border-ink p-5 shadow-[5px_5px_0_var(--ink)] ${i === 1 ? "bg-brand-soft" : "bg-surface"}`}>
                  <Quote className="mb-2 size-7 fill-brand text-brand" aria-hidden />
                  <blockquote className="text-lg font-semibold leading-snug">{r.body}</blockquote>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t-2 border-ink pt-3">
                    <figcaption className="text-sm font-extrabold uppercase">{r.name}{r.city && <span className="font-medium normal-case text-muted"> · {r.city}</span>}</figcaption>
                    <span className="flex" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-ink text-ink" : "text-line"}`} />)}</span>
                  </div>
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
  // "How it works" sits right after the hero/trust band — it's the heart of a COD store
  const how = <HowItWorks key="how" t={t} codMode={codMode} />;
  nodes.splice(Math.min(nodes.length, heroIdx + 2 < 0 ? 0 : heroIdx + 2), 0, how);
  return <>{nodes}</>;
}

function Heading({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
      <h2 className="display text-3xl font-extrabold uppercase sm:text-5xl">{title}</h2>
      {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-extrabold uppercase underline-offset-4 hover:underline">{more} <ArrowUpRight className="size-4 rtl:-scale-x-100" /></Link>}
    </div>
  );
}

function HowItWorks({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <Heading title={t("how.title")} />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={i} className="relative border-2 border-ink bg-surface p-5 pt-12 shadow-[5px_5px_0_var(--ink)]">
            <span className="display num absolute start-0 top-0 grid h-11 min-w-11 place-items-center border-e-2 border-b-2 border-ink bg-brand px-3 text-2xl text-brand-ink">{i + 1}</span>
            <h3 className="display text-2xl font-extrabold uppercase">{title}</h3>
            <p className="mt-1 text-muted">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Hero({ s, lang, t }: { s: Settings; lang: Lang; t: TFn }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-5 md:pt-8" aria-roledescription="carousel">
      <div className="scroll-snap-x flex gap-4 pb-1">
        {slides.map((sl, i) => (
          <div key={i} className="grid gap-0 border-2 border-ink shadow-[7px_7px_0_var(--ink)] lg:grid-cols-[1.05fr_1fr]" aria-roledescription="slide">
            <div className="relative flex flex-col justify-between gap-8 bg-brand p-6 text-brand-ink md:p-10 lg:min-h-[30rem]">
              <p className="inline-flex w-fit items-center gap-2 border-2 border-current px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em]"><Banknote className="size-4" aria-hidden />{t("cod.payOnDelivery")}</p>
              {i === 0 ? (
                <h1 className="display break-words text-[clamp(2.6rem,9vw,5.6rem)] font-extrabold uppercase">{tr(sl.title, lang)}</h1>
              ) : (
                <h2 className="display break-words text-[clamp(2.6rem,9vw,5.6rem)] font-extrabold uppercase">{tr(sl.title, lang)}</h2>
              )}
              <div>
                <p className="max-w-md text-base font-medium md:text-lg">{tr(sl.sub, lang)}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-lg !bg-[#111] !text-white">{tr(sl.cta, lang)} <ArrowUpRight className="size-5 rtl:-scale-x-100" /></Link>}
                  {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg btn-outline">{tr(sl.cta2, lang)}</Link>}
                </div>
              </div>
            </div>
            <div className="relative min-h-72 border-t-2 border-ink bg-sunken lg:min-h-0 lg:border-s-2 lg:border-t-0">
              {sl.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
              ) : (
                <div className="hatch absolute inset-0" />
              )}
              <span className="sticker absolute bottom-4 end-4 grid size-28 place-items-center rounded-full border-2 border-ink bg-accent p-2 text-center text-[0.7rem] font-extrabold uppercase leading-tight text-accent-ink shadow-[4px_4px_0_var(--ink)] sm:size-32">
                {t("cod.payOnDelivery")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
