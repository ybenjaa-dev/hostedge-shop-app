import Link from "next/link";
import { ChevronRight, ChevronLeft, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star } from "lucide-react";
import { getSettings, type Settings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";

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
  const Arrow = dirOf(lang) === "rtl" ? ChevronLeft : ChevronRight;

  const shelf = (id: string, title: string, items: typeof featured.items, ranked = false) =>
    items.length ? (
      <section key={id} className="panel mx-auto mt-4 max-w-[84rem]">
        <div className="bar"><h2>{title}</h2><Link href="/shop" className="inline-flex items-center gap-0.5">{t("home.viewAll")}<Arrow className="size-4" /></Link></div>
        <div className="rail">{items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={ranked ? i + 1 : undefined} />)}</div>
      </section>
    ) : null;

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <HeroBlock key={id} s={s} lang={lang} t={t} cats={cats.map((c) => ({ slug: c.slug, name: c.name, count: c.count }))} />;
      case "trust":
        return (
          <section key={id} className="mx-auto mt-4 grid max-w-[84rem] border border-line bg-surface sm:grid-cols-3">
            {s.trust.map((b, i) => {
              const Icon = ICONS[b.icon] ?? ShieldCheck;
              return (
                <div key={i} className="flex items-center gap-3 border-line p-4 max-sm:border-b sm:border-s first:sm:border-s-0">
                  <Icon className="size-9 shrink-0 text-brand" strokeWidth={1.6} aria-hidden />
                  <div><p className="font-extrabold">{tr(b.title, lang)}</p><p className="text-sm text-muted">{tr(b.text, lang)}</p></div>
                </div>
              );
            })}
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="panel mx-auto mt-4 max-w-[84rem]">
            <div className="bar"><h2>{t("home.categories")}</h2></div>
            <div className="grid grid-cols-2 bg-surface sm:grid-cols-3 lg:grid-cols-6">
              {cats.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="group flex flex-col items-center gap-2 border-b border-e border-line p-4 text-center hover:bg-sunken">
                  <span className="block aspect-square w-full max-w-28 overflow-hidden border border-line bg-white">{c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover" />}</span>
                  <span className="text-sm font-bold group-hover:text-brand group-hover:underline">{tr(c.name, lang)}</span>
                  <span className="num text-xs text-muted">{c.count}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      case "featured":
        return shelf(id, t("home.featured"), featured.items);
      case "bestsellers":
        return shelf(id, t("home.bestsellers"), best.items, true);
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto mt-4 max-w-[84rem]">
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/5] min-h-36 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/70 to-transparent p-5 text-white rtl:bg-gradient-to-l md:p-10"><span className="display text-2xl md:text-4xl">{tr(s.home.banner.title, lang)}</span><span className="mt-1 max-w-md text-sm">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="panel mx-auto mt-4 max-w-[84rem]">
            <div className="bar"><h2>{t("home.reviews")}</h2></div>
            <div className="grid gap-px bg-line md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="bg-surface p-4">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-accent text-accent" : "text-rule"}`} />)}</div>
                  <blockquote className="mt-2">{r.body}</blockquote>
                  <figcaption className="mt-2 text-sm font-bold">{r.name}{r.city && <span className="font-normal text-muted"> — {r.city}</span>}</figcaption>
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
  nodes.splice(Math.max(0, heroIdx + 2), 0, <HowItWorks key="how" t={t} codMode={codMode} />);
  return <div className="px-3 pb-6 pt-3">{nodes}</div>;
}

function HowItWorks({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className="panel mx-auto mt-4 max-w-[84rem]">
      <div className="bar"><h2>{t("how.title")}</h2></div>
      <ol className="grid gap-px bg-line md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={i} className="flex gap-3 bg-surface p-4">
            <span className="num grid size-9 shrink-0 place-items-center bg-brand text-lg font-extrabold text-brand-ink">{i + 1}</span>
            <div><h3 className="font-extrabold">{title}</h3><p className="text-sm text-muted">{text}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Marketplace opening: department menu on one side, banner slider on the other. */
function HeroBlock({ s, lang, t, cats }: { s: Settings; lang: Lang; t: TFn; cats: { slug: string; name: string; count: number }[] }) {
  const Arrow = dirOf(lang) === "rtl" ? ChevronLeft : ChevronRight;
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="mx-auto grid max-w-[84rem] gap-3 lg:grid-cols-[16rem_1fr]" aria-roledescription="carousel">
      <nav className="panel hidden lg:block" aria-label={t("shop.category")}>
        <div className="bar bar-brand"><h2>{t("shop.category")}</h2></div>
        <ul>
          <li><Link href="/shop" className="flex items-center justify-between border-b border-line px-4 py-2.5 font-bold hover:bg-sunken hover:text-brand">{t("shop.allCategories")}<Arrow className="size-4" /></Link></li>
          {cats.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-0 hover:bg-sunken hover:text-brand"><span>{tr(c.name, lang)}</span><span className="num text-xs text-muted">{c.count}</span></Link></li>)}
        </ul>
      </nav>
      <div className="scroll-snap-x flex gap-3">
        {slides.map((sl, i) => (
          <div key={i} className="relative min-h-[17rem] overflow-hidden border border-line bg-secondary md:min-h-[24rem]" aria-roledescription="slide">
            {sl.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent rtl:bg-gradient-to-l" />
            <div className="relative flex min-h-[17rem] max-w-xl flex-col justify-center p-6 text-white md:min-h-[24rem] md:p-10">
              <p className="mb-2 w-fit bg-accent px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-accent-ink">{t("cod.payOnDelivery")}</p>
              {i === 0 ? <h1 className="display text-3xl sm:text-4xl md:text-5xl">{tr(sl.title, lang)}</h1> : <h2 className="display text-3xl sm:text-4xl md:text-5xl">{tr(sl.title, lang)}</h2>}
              <p className="mt-2 max-w-md text-base text-white/90">{tr(sl.sub, lang)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary btn-lg px-6">{tr(sl.cta, lang)}</Link>}
                {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border-white bg-transparent text-white hover:bg-white/15">{tr(sl.cta2, lang)}</Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
