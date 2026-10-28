import Link from "next/link";
import { Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";

const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };

/** Category tiles: uneven spans and offsets, pictures only in safe ratios. */
const TILES = [
  { span: "col-span-2 md:col-span-7", pic: "aspect-square" },
  { span: "col-span-1 md:col-span-5", pic: "aspect-[4/5]", mt: "md:mt-20" },
  { span: "col-span-1 md:col-span-4", pic: "aspect-[4/5]" },
  { span: "col-span-1 md:col-span-4", pic: "aspect-square", mt: "md:mt-12" },
  { span: "col-span-1 md:col-span-4", pic: "aspect-[4/5]", mt: "md:mt-28" },
] as const;

const pad = "px-5 sm:px-10";
const Arrow = () => <span aria-hidden className="inline-block rtl:rotate-180">→</span>;

export default async function Home() {
  const s = await getSettings();
  const { lang, t } = await getT();
  const [cats, featured, best, reviews] = await Promise.all([
    listCategories(),
    listProducts({ featured: true, perPage: 6 }),
    listProducts({ bestsellers: true, perPage: 8 }),
    listReviews({ limit: 6 }),
  ]);
  const cur = s.store.currency;
  const codMode = s.checkout.codMode;

  const head = (title: string, kicker?: string) => (
    <div className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-5">
      <div>{kicker && <p className="micro mb-2">{kicker}</p>}<h2 className="display text-4xl sm:text-5xl">{title}</h2></div>
      <Link href="/shop" className="micro ulink shrink-0 pb-1.5 text-ink">{t("home.viewAll")} <Arrow /></Link>
    </div>
  );

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <HeroBlock key={id} s={s} lang={lang} t={t} cats={cats.map((c) => ({ slug: c.slug, name: c.name, count: c.count }))} />;
      case "trust":
        return (
          <section key={id} className={`${pad} mt-0`}>
            <div className="grid divide-line border-b border-line sm:grid-cols-3 sm:divide-x rtl:sm:divide-x-reverse">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <div key={i} className="flex items-center gap-4 py-6 max-sm:border-t max-sm:border-line sm:px-6 first:sm:ps-0">
                    <Icon className="size-6 shrink-0 text-brand" strokeWidth={1.2} aria-hidden />
                    <p className="text-sm"><span className="block font-medium">{tr(b.title, lang)}</span><span className="text-muted">{tr(b.text, lang)}</span></p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className={`${pad} mt-24`}>
            {head(t("home.categories"), t("nav.collections"))}
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-12 md:gap-x-10">
              {cats.slice(0, 5).map((c, i) => {
                const tile: { span: string; pic: string; mt?: string } = TILES[i % TILES.length]!;
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className={`nh-fig group block ${tile.span} ${tile.mt ?? ""}`}>
                    <span className={`nh-img ${tile.pic}`}>
                      {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />}
                    </span>
                    <span className="mt-3 flex items-baseline justify-between gap-3"><span className="display text-2xl group-hover:text-brand sm:text-3xl">{tr(c.name, lang)}</span><span className="micro num">{String(i + 1).padStart(2, "0")} · {c.count}</span></span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      case "featured":
        if (!featured.items.length) return null;
        return (
          <section key={id} className={`${pad} mt-28`}>
            {head(t("home.featured"), t("home.lookbook"))}
            <ProductGrid>{featured.items.slice(0, 6).map((p, i) => <ProductCard key={p.id} p={p} i={i} lang={lang} t={t} currency={cur} codMode={codMode} />)}</ProductGrid>
          </section>
        );
      case "bestsellers":
        if (!best.items.length) return null;
        return (
          <section key={id} className="mt-12 border-t border-line bg-sunken py-20">
            <div className={pad}>{head(t("home.bestsellers"))}
              <div className="nh-rail">{best.items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} fixed lang={lang} t={t} currency={cur} codMode={codMode} rank={i + 1} />)}</div>
            </div>
          </section>
        );
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="relative mt-24">
            <Link href={s.home.banner.href || "/shop"} className="nh-img block aspect-[4/5] sm:aspect-[16/7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="absolute inset-0 size-full object-cover" />
              <span className="absolute bottom-0 start-0 max-w-md bg-bg p-6 sm:p-10"><span className="display block text-3xl sm:text-4xl">{tr(s.home.banner.title, lang)}</span><span className="mt-2 block text-sm text-muted">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews": {
        if (!reviews.length) return null;
        const [first, ...rest] = reviews;
        return (
          <section key={id} className={`${pad} mt-28`}>
            <p className="micro mb-8">{t("home.reviews")}</p>
            <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
              <figure>
                <blockquote className="display text-3xl sm:text-5xl">“{first!.body}”</blockquote>
                <figcaption className="micro mt-6">{first!.name}{first!.city && ` — ${first!.city}`}</figcaption>
              </figure>
              <div className="space-y-8 lg:border-s lg:border-line lg:ps-10">
                {rest.slice(0, 2).map((r) => (
                  <figure key={r.id}><blockquote className="text-sm leading-relaxed text-muted">“{r.body}”</blockquote><figcaption className="micro mt-2 text-ink">{r.name}{r.city && ` — ${r.city}`}</figcaption></figure>
                ))}
              </div>
            </div>
          </section>
        );
      }
    }
    return null;
  };

  const sections = s.home.sections.filter((x) => x.visible);
  const heroIdx = sections.findIndex((x) => x.id === "hero");
  const nodes = sections.map((x) => render(x.id));
  nodes.splice(Math.max(0, heroIdx + 3), 0, <Story key="story" t={t} codMode={codMode} />);
  return <div className="pb-6">{nodes}</div>;
}

/** Editorial pause: one sentence about the brand, then the three COD steps as quiet numbered columns. */
function Story({ t, codMode }: { t: TFn; codMode: boolean }) {
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className={`${pad} mt-28`}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <h2 className="display text-4xl sm:text-6xl">{t("home.story")}</h2>
        <p className="max-w-lg self-end text-lg leading-relaxed text-muted">{t("home.storyD")}</p>
      </div>
      {codMode && (
        <ol className="mt-16 grid gap-px border-t border-line sm:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={i} className="pt-6 sm:pe-8">
              <span className="display num text-5xl text-brand">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-3 font-medium">{title}</h3><p className="mt-1 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Full-bleed split opening: room-scene picture on one side, a few quiet words on the other. */
function HeroBlock({ s, lang, t, cats }: { s: Settings; lang: Lang; t: TFn; cats: { slug: string; name: string; count: number }[] }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="scroll-snap-x flex" aria-roledescription="carousel">
      {slides.map((sl, i) => (
        <div key={i} className="grid lg:min-h-dvh lg:grid-cols-[5fr_6fr]" aria-roledescription="slide">
          <div className="order-2 flex flex-col justify-between gap-14 px-5 py-10 sm:px-10 lg:order-1 lg:py-14">
            <p className="micro flex items-center justify-between"><span>{t("home.kicker")}</span><span className="num">N° {String(i + 1).padStart(2, "0")}</span></p>
            <div>
              {i === 0 ? <h1 className="display text-[3.4rem] sm:text-7xl xl:text-[6.2rem]">{tr(sl.title, lang)}</h1> : <h2 className="display text-[3.4rem] sm:text-7xl xl:text-[6.2rem]">{tr(sl.title, lang)}</h2>}
              <p className="mt-6 max-w-sm text-base leading-relaxed text-muted">{tr(sl.sub, lang)}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary btn-lg">{tr(sl.cta, lang)}</Link>}
                {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="micro ulink text-ink">{tr(sl.cta2, lang)}</Link>}
              </div>
            </div>
            <ul className="hidden flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 lg:flex">
              {cats.slice(0, 5).map((c, k) => <li key={c.slug}><Link href={`/category/${c.slug}`} className="micro hover:!text-ink"><span className="num me-1.5 opacity-60">{String(k + 1).padStart(2, "0")}</span>{tr(c.name, lang)}</Link></li>)}
            </ul>
          </div>
          <div className="nh-img order-1 aspect-[4/5] lg:order-2 lg:aspect-auto">
            {sl.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />}
          </div>
        </div>
      ))}
    </section>
  );
}
