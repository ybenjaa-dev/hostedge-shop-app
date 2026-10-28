import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getSettings, type Settings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews, type ProductCard as PCard } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { Money } from "@/components/money";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function SectionTitle({ title, sub, href, more }: { title: string; sub?: string; href?: string; more?: string }) {
  return (
    <div className="mb-2 text-center">
      <div className="flex items-center gap-4"><span className="h-px flex-1 bg-rule" /><h2 className="display text-3xl sm:text-4xl">{title}</h2><span className="h-px flex-1 bg-rule" /></div>
      {sub && <p className="italic-serif mt-1 text-muted">{sub}</p>}
      {href && more && <Link href={href} className="mt-2 inline-block text-xs font-bold uppercase tracking-[0.16em] text-brand underline-offset-4 hover:underline rtl:tracking-normal">{more} →</Link>}
    </div>
  );
}

export default async function Home() {
  const s = await getSettings();
  const { lang, t } = await getT();
  const [cats, featured, best, reviews] = await Promise.all([
    listCategories(),
    listProducts({ featured: true, perPage: 10 }),
    listProducts({ bestsellers: true, perPage: 6 }),
    listReviews({ limit: 6 }),
  ]);
  const cur = s.store.currency;
  const codMode = s.checkout.codMode;
  const lead = featured.items[0] ?? best.items[0] ?? null;

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} lead={lead} currency={cur} />;
      case "trust":
        return (
          <section key={id} className="mx-auto mt-14 max-w-[80rem] px-4">
            <div className="grid divide-line border-y border-line sm:grid-cols-3 sm:divide-x rtl:sm:divide-x-reverse max-sm:divide-y">
              {s.trust.map((b, i) => (
                <div key={i} className="px-6 py-6 text-center">
                  <p className="display text-lg text-brand">{ROMAN[i]}.</p>
                  <p className="display text-xl">{tr(b.title, lang)}</p>
                  <p className="mt-0.5 text-sm text-muted">{tr(b.text, lang)}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-3xl px-4">
            <SectionTitle title={t("bk.contents")} sub={t("home.categories")} />
            <ol className="mt-6">
              {cats.map((c, i) => (
                <li key={c.id}>
                  <Link href={`/category/${c.slug}`} className="group leader border-b border-line/0 py-3 hover:text-brand">
                    <span className="display w-9 shrink-0 text-lg text-brand">{ROMAN[i] ?? i + 1}</span>
                    <span className="display text-2xl group-hover:italic sm:text-3xl">{tr(c.name, lang)}</span>
                    <span className="dots" aria-hidden />
                    <span className="num italic-serif shrink-0 text-muted">{t("bk.titles", { n: c.count })}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      case "featured":
        if (!featured.items.length) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-[80rem] px-4">
            <SectionTitle title={t("home.featured")} sub={t("bk.newSub")} href="/shop" more={t("home.viewAll")} />
            <ProductGrid wide>{featured.items.slice(0, 10).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} priority={i < 4} />)}</ProductGrid>
          </section>
        );
      case "bestsellers":
        if (!best.items.length) return null;
        return <Bestsellers key={id} items={best.items} lang={lang} t={t} currency={cur} />;
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-[80rem] px-4">
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden border border-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/6] min-h-40 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/70 to-transparent p-6 text-white rtl:bg-gradient-to-l md:p-12"><span className="display text-3xl md:text-5xl">{tr(s.home.banner.title, lang)}</span><span className="italic-serif mt-1 max-w-md">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-[80rem] px-4">
            <SectionTitle title={t("bk.readers")} sub={t("home.reviews")} />
            <div className="mt-8 grid gap-10 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="relative border-t-2 border-ink pt-4">
                  <span className="quote-mark absolute -top-1 end-0" aria-hidden>”</span>
                  <blockquote className="serif text-lg italic leading-relaxed">{r.body}</blockquote>
                  <figcaption className="mt-3 text-xs font-bold uppercase tracking-[0.16em] rtl:tracking-normal">{r.name}{r.city && <span className="font-normal normal-case tracking-normal text-muted"> — {r.city}</span>}</figcaption>
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
  return <div className="pb-6">{nodes}</div>;
}

function Bestsellers({ items, lang, t, currency }: { items: PCard[]; lang: Lang; t: TFn; currency: string }) {
  return (
    <section className="mt-20 border-y border-line bg-sunken/60 py-14">
      <div className="mx-auto max-w-[80rem] px-4">
        <SectionTitle title={t("home.bestsellers")} sub={t("bk.listSub")} href="/shop?sort=popular" more={t("home.viewAll")} />
        <ol className="mt-8 grid gap-x-16 md:grid-cols-2">
          {items.slice(0, 6).map((p, i) => {
            const author = tr(p.shortDesc, lang);
            return (
              <li key={p.id} className="cover-lift border-b border-rule/60 py-4">
                <Link href={`/p/${p.slug}`} className="grid grid-cols-[2.6rem_3.6rem_1fr_auto] items-center gap-x-4">
                  <span className="display num text-4xl text-brand/80 sm:text-5xl">{i + 1}</span>
                  <span className="cover">{p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(p.image, "thumb")} alt="" loading="lazy" />}</span>
                  <span className="min-w-0">
                    <span className="display line-clamp-2 block text-lg leading-snug">{tr(p.name, lang)}</span>
                    {author && <span className="italic-serif block truncate text-sm text-muted">{t("bk.byline", { name: author })}</span>}
                  </span>
                  <Money amount={p.minPrice} currency={currency} lang={lang} className="num font-bold" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function HowItWorks({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  return (
    <section className="mx-auto mt-20 max-w-[80rem] px-4">
      <SectionTitle title={t("how.title")} />
      <ol className="mt-8 grid gap-8 md:grid-cols-3">
        {steps.map(([title, text], i) => (
          <li key={i} className="flex gap-4">
            <span className="display num text-6xl leading-none text-brand/70">{i + 1}</span>
            <div className="border-t border-ink pt-2"><h3 className="display text-xl">{title}</h3><p className="mt-1 text-sm text-muted">{text}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Opening spread: left page carries the editorial block, right page stands the lead title on a shelf-scene illustration. */
function Hero({ s, lang, t, lead, currency }: { s: Settings; lang: Lang; t: TFn; lead: PCard | null; currency: string }) {
  const Arrow = dirOf(lang) === "rtl" ? ChevronLeft : ChevronRight;
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  const cta = sl ? tr(sl.cta, lang) : t("home.hero.cta");
  const leadAuthor = lead ? tr(lead.shortDesc, lang) : "";
  return (
    <section className="mx-auto max-w-[80rem] px-4 pt-6 sm:pt-10" aria-label={s.store.name}>
      <div className="relative grid overflow-hidden border border-ink bg-surface shadow-[0_30px_50px_-30px_rgb(40_20_10/.6)] md:grid-cols-2">
        <div className="relative order-2 flex flex-col justify-center px-6 py-10 sm:px-12 md:order-1 md:py-16 lg:px-16">
          <p className="eyebrow">{t("bk.pick")}</p>
          <h1 className="display mt-4 text-[2.5rem] sm:text-6xl lg:text-7xl">{title}</h1>
          {sub && <p className="italic-serif mt-5 max-w-md text-lg text-muted sm:text-xl">{sub}</p>}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={sl?.href || "/shop"} className="btn btn-primary btn-lg">{cta}</Link>
            {lead && <Link href={`/p/${lead.slug}`} className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-[0.14em] underline-offset-4 hover:text-brand hover:underline rtl:tracking-normal">{t("bk.readSample")}<Arrow className="size-4" aria-hidden /></Link>}
          </div>
          <span className="display num absolute bottom-4 start-6 text-sm text-muted sm:start-12" aria-hidden>— 1 —</span>
        </div>
        <div className="relative order-1 grid min-h-[22rem] place-items-center overflow-hidden bg-sunken px-6 py-10 md:order-2 md:min-h-[32rem]">
          {sl?.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" loading="eager" fetchPriority="high" />}
          <div className="pointer-events-none absolute inset-y-0 start-0 hidden w-16 bg-gradient-to-r from-black/25 to-transparent md:block rtl:bg-gradient-to-l" aria-hidden />
          {lead && (
            <Link href={`/p/${lead.slug}`} className="relative block w-44 rotate-3 transition-transform duration-300 hover:rotate-0 sm:w-56 lg:w-64" aria-label={tr(lead.name, lang)}>
              <span className="cover cover-big">{lead.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(lead.image, "md")} alt={tr(lead.name, lang)} />}</span>
              <span className="absolute -bottom-5 -end-4 z-10 max-w-[12rem] border border-ink bg-surface px-3 py-2 text-start shadow-[3px_3px_0_var(--ink)] sm:-end-10">
                <span className="display line-clamp-1 block text-sm">{tr(lead.name, lang)}</span>
                {leadAuthor && <span className="italic-serif block truncate text-xs text-muted">{leadAuthor}</span>}
                <Money amount={lead.minPrice} currency={currency} lang={lang} className="num text-sm font-bold text-brand" />
              </span>
            </Link>
          )}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/15 to-transparent md:block" aria-hidden />
      </div>
    </section>
  );
}
