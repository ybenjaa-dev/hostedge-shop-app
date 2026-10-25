import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { getSettings, type Settings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews, type ProductCard as PC } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";

export default async function Home() {
  const s = await getSettings();
  const { lang, t } = await getT();
  const [cats, featured, best, reviews] = await Promise.all([
    listCategories(), listProducts({ featured: true, perPage: 8 }), listProducts({ bestsellers: true, perPage: 8 }), listReviews({ limit: 6 }),
  ]);
  const cur = s.store.currency;
  const codMode = s.checkout.codMode;
  const Arrow = dirOf(lang) === "rtl" ? ArrowLeft : ArrowRight;

  const rail = (id: string, title: string, items: PC[], ranked = false) =>
    items.length ? (
      <section key={id} className="mx-auto max-w-[88rem] px-4 py-12 md:px-6 md:py-16">
        <div className="mb-7 flex items-end justify-between gap-4"><h2 className="display text-[2.2rem] sm:text-6xl">{title}</h2><Link href="/shop" className="label-s link-arrow shrink-0">{t("home.viewAll")}<Arrow className="size-4" /></Link></div>
        <div className="rail">{items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={ranked ? i + 1 : undefined} />)}</div>
      </section>
    ) : null;

  const render = (id: string) => {
    switch (id) {
      case "hero": return <Hero key={id} s={s} lang={lang} t={t} Arrow={Arrow} />;
      case "trust":
        return (
          <section key={id} className="border-y border-line">
            <ul className="mx-auto grid max-w-[88rem] divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {s.trust.map((b, i) => <li key={i} className="px-6 py-5 text-center"><p className="label-s">{tr(b.title, lang)}</p><p className="mt-1 text-sm text-muted">{tr(b.text, lang)}</p></li>)}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[88rem] px-4 py-12 md:px-6 md:py-16">
            <ul className="border-t border-ink">
              {cats.map((c, i) => (
                <li key={c.id} className="group border-b border-line">
                  <Link href={`/category/${c.slug}`} className="flex items-center justify-between gap-4 py-5 md:py-7">
                    <span className="label-s num w-10 text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="display flex-1 text-[2.6rem] transition group-hover:translate-x-2 rtl:group-hover:-translate-x-2 sm:text-7xl">{tr(c.name, lang)}</span>
                    <span className="hidden size-20 shrink-0 overflow-hidden bg-sunken opacity-0 transition group-hover:opacity-100 md:block">{c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" loading="lazy" className="size-full object-cover" />}</span>
                    <span className="label-s num text-muted">{c.count}</span><Arrow className="size-5 transition group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      case "featured": return rail(id, t("home.featured"), featured.items);
      case "bestsellers": return rail(id, t("home.bestsellers"), best.items, true);
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto max-w-[88rem] px-4 py-8 md:px-6">
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/7] min-h-48 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white md:p-12"><span className="display text-4xl md:text-7xl">{tr(s.home.banner.title, lang)}</span><span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[88rem] px-4 py-12 md:px-6 md:py-16">
            <h2 className="display mb-8 text-[2.2rem] sm:text-6xl">{t("home.reviews")}</h2>
            <div className="grid gap-px border-y border-line bg-line md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="bg-bg px-1 py-7 md:px-8">
                  <blockquote className="text-xl leading-snug">“{r.body}”</blockquote>
                  <figcaption className="label-s mt-5 text-muted">{r.name}{r.city && ` — ${r.city}`} · {"★".repeat(r.rating)}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
    }
    return null;
  };
  return <>{s.home.sections.filter((x) => x.visible).map((x) => render(x.id))}</>;
}

function Hero({ s, lang, t, Arrow }: { s: Settings; lang: Lang; t: TFn; Arrow: typeof ArrowRight }) {
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section aria-roledescription="carousel">
      <div className="scroll-snap-x flex">
        {slides.map((sl, i) => (
          <div key={i} className="mx-auto grid w-full max-w-[88rem] md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" aria-roledescription="slide">
            <div className="order-2 flex flex-col justify-between gap-10 px-5 py-8 md:order-1 md:px-8 md:py-14">
              <p className="label-s text-muted">{t("cod.payOnDelivery")} — {new Date().getFullYear()}</p>
              <div>
                {i === 0 ? <h1 className="display break-words text-[clamp(2.3rem,5.6vw,4.9rem)]">{tr(sl.title, lang)}</h1> : <h2 className="display break-words text-[clamp(2.3rem,5.6vw,4.9rem)]">{tr(sl.title, lang)}</h2>}
                <p className="mt-6 max-w-md text-lg text-muted">{tr(sl.sub, lang)}</p>
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
                  {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary px-9">{tr(sl.cta, lang)}</Link>}
                  {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) ? <Link href={sl.href2 || "/shop"} className="label-s link-arrow">{tr(sl.cta2, lang)}<Arrow className="size-4" /></Link> : <Link href="/shop?sort=popular" className="label-s link-arrow">{t("home.bestsellers")}<Arrow className="size-4" /></Link>}
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="relative aspect-[4/5] overflow-hidden bg-sunken md:aspect-auto md:h-full md:min-h-[38rem]">
                {sl.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                ) : null}
                <span className="label-s absolute bottom-4 start-4 bg-bg px-3 py-1.5">{String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
