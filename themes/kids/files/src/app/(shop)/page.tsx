import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Baby } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { kidIcon } from "@/lib/goal-icon";

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
  const sections = s.home.sections.filter((x) => x.visible);

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <Hero key={id} s={s} lang={lang} t={t} />;
      case "trust":
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 pt-8">
            <ul className="grid gap-3 sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="soft flex items-center gap-3 rounded-full bg-surface p-2.5 pe-5">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-full text-[#1e2a4a] ${TINT[i % TINT.length]}`}><Icon className="size-6" aria-hidden /></span>
                    <span className="min-w-0"><span className="block font-extrabold leading-tight">{tr(b.title, lang)}</span><span className="text-sm text-muted">{tr(b.text, lang)}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <div key={id}>
            <section className="mx-auto max-w-7xl px-4 py-12">
              <SectionTitle title={t("home.ages")} sub={t("home.agesD")} />
              <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
                {AGES.map((a, i) => (
                  <Link key={a.q} href={`/shop?q=${encodeURIComponent(a.q)}`} className={`soft group flex aspect-square flex-col items-center justify-center rounded-full text-center text-[#1e2a4a] transition hover:-translate-y-1 hover:rotate-2 ${TINT[i % TINT.length]}`}>
                    <span className="heading text-[clamp(2rem,9vw,3.4rem)]" dir="ltr">{a.num}</span>
                    <span className="text-sm font-extrabold">{a.unit[lang === "fr" ? 1 : lang === "ar" ? 2 : 0]}</span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 pb-6">
              <SectionTitle title={t("home.categories")} />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {cats.map((c) => {
                  const Icon = kidIcon(`${c.slug} ${tr(c.name, lang)}`);
                  return (
                    <Link key={c.id} href={`/category/${c.slug}`} className="soft group relative block aspect-[4/5] overflow-hidden rounded-[2rem] bg-sunken">
                      {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
                      <span className="heading absolute inset-x-2.5 bottom-2.5 flex items-center gap-2 rounded-full bg-white p-1.5 pe-4 text-base text-[#1e2a4a] sm:text-lg"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-brand-ink"><Icon className="size-4.5" /></span><span className="min-w-0 truncate">{tr(c.name, lang)}</span></span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        );
      case "featured":
        return products(id, t("home.featured"), featured.items);
      case "bestsellers":
        return products(id, t("home.bestsellers"), best.items, true);
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-8">
            <Link href={s.home.banner.href || "/shop"} className="relative block overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/6] min-h-40 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/60 to-transparent p-6 text-white rtl:bg-gradient-to-l md:p-12">
                <span className="display text-2xl font-extrabold md:text-4xl">{tr(s.home.banner.title, lang)}</span>
                <span className="mt-1 max-w-md text-sm md:text-base">{tr(s.home.banner.sub, lang)}</span>
              </span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-12">
            <SectionTitle title={t("home.reviews")} />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r, i) => (
                <figure key={r.id} className={`soft flex flex-col rounded-[2rem] p-6 ${["bg-[#ffe9e4]", "bg-[#dff5f1]", "bg-[#ebe7fc]"][i % 3]} text-[#1e2a4a]`}>
                  <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-5 ${k < r.rating ? "fill-[#ffc933] text-[#ffc933]" : "text-white"}`} />)}</div>
                  <blockquote className="mt-3 flex-1 font-medium leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-4 text-sm font-extrabold">{r.name}{r.city && <span className="font-medium opacity-70"> · {r.city}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
    }
    return null;
  };

  function products(id: string, title: string, items: typeof featured.items, rail = false) {
    if (!items.length) return null;
    return (
      <section key={id} className="mx-auto max-w-7xl px-4 py-10">
        <SectionTitle title={title} href="/shop" more={t("home.viewAll")} />
        {rail ? <div className="rail">{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</div> : <ProductGrid>{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</ProductGrid>}
      </section>
    );
  }

  return <>{sections.map((x) => render(x.id))}</>;
}

const TINT = ["bg-[#ffe1db]", "bg-[#d7f3ee]", "bg-[#e6e1fb]", "bg-[#fff0bf]"];
const AGES: { q: string; num: string; unit: [string, string, string] }[] = [
  { q: "0–6 months", num: "0–6", unit: ["months", "mois", "أشهر"] },
  { q: "6–12 months", num: "6–12", unit: ["months", "mois", "شهراً"] },
  { q: "1–3 years", num: "1–3", unit: ["years", "ans", "سنوات"] },
  { q: "3–6 years", num: "3–6", unit: ["years", "ans", "سنوات"] },
];

function SectionTitle({ title, sub, href, more }: { title: string; sub?: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0"><h2 className="heading text-[clamp(1.8rem,5vw,2.8rem)]">{title}</h2>{sub && <p className="mt-1 text-muted">{sub}</p>}</div>
      {href && <Link href={href} className="btn btn-outline btn-sm shrink-0">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: string; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 sm:pt-5">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#d8ecfb] via-[#e6e1fb] to-[#ffe4d6] px-6 py-10 text-[#1e2a4a] sm:px-12 md:py-16 dark:from-[#1b2a58] dark:via-[#2a2560] dark:to-[#3a2750] dark:text-white">
        <span aria-hidden className="absolute -start-10 top-10 size-40 rounded-full bg-[#ffc933]/50 blur-sm" />
        <span aria-hidden className="absolute -bottom-12 end-1/3 size-48 rounded-full bg-[#3fb6a8]/30" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="bubble"><Baby className="size-4 text-brand" />{t("home.gentle")}</span>
            <h1 className="heading mt-4 text-[clamp(2.5rem,7vw,4.8rem)]">{title}</h1>
            {sub && <p className="mt-4 max-w-md text-base font-medium opacity-80 md:text-lg">{sub}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={sl?.href || "/shop"} className="btn btn-primary btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
              {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg !bg-white !text-[#1e2a4a]">{tr(sl.cta2, lang)}</Link>}
            </div>
          </div>
          {sl?.image && (
            <div className="relative mx-auto w-full max-w-sm">
              <div className="aspect-square overflow-hidden rounded-full border-[10px] border-white shadow-[0_30px_60px_-30px_rgb(30_42_74/.6)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(sl.image)} alt="" className="size-full object-cover" loading="eager" fetchPriority="high" />
              </div>
              <span className="bubble bob absolute -top-2 end-2 !text-sm" style={{ "--r": "6deg" } as React.CSSProperties}><ShieldCheck className="size-4 text-[#3fb6a8]" />EN71</span>
              <span className="bubble bob absolute bottom-6 -start-2 !text-sm" style={{ "--r": "-6deg", animationDelay: "1.2s" } as React.CSSProperties}><Star className="size-4 fill-[#ffc933] text-[#ffc933]" />4.9</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
