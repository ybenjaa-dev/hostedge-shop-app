import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Home as HomeIcon } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { roomIcon } from "@/lib/goal-icon";

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
          <section key={id} className="mx-auto max-w-7xl px-4 pt-6">
            <ul className="grid gap-3 sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3 rounded-3xl bg-sunken p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-brand"><Icon className="size-5" aria-hidden /></span>
                    <span><span className="block font-bold">{tr(b.title, lang)}</span><span className="text-sm text-muted">{tr(b.text, lang)}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-12">
            <SectionTitle title={t("home.rooms")} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
              {cats.map((c, i) => {
                const Icon = roomIcon(`${c.slug} ${tr(c.name, lang)}`);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className={`group relative block overflow-hidden rounded-[1.75rem] bg-sunken ${i === 0 ? "col-span-2 aspect-[16/10] md:aspect-auto md:row-span-2" : "aspect-square"}`}>
                    {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />}
                    <span className="absolute bottom-3 start-3 inline-flex items-center gap-2 rounded-full bg-surface/95 py-1.5 pe-4 ps-1.5 text-sm font-bold shadow-sm backdrop-blur">
                      <span className="grid size-8 place-items-center rounded-full bg-brand text-brand-ink"><Icon className="size-4" /></span>{tr(c.name, lang)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      case "featured":
        return products(id, t("home.featured"), featured.items);
      case "bestsellers":
        return (
          <div key={id}>
            <section className="mx-auto max-w-7xl px-4 py-6">
              <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-brand p-7 text-brand-ink sm:flex-row sm:items-center sm:p-10">
                <div><p className="heading text-2xl sm:text-3xl">{t("home.bundle")}</p><p className="mt-1 opacity-85">{t("home.bundleD")}</p></div>
                <Link href="/shop" className="btn btn-lg shrink-0 bg-white text-[#2b2620] hover:bg-white/90">{t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
              </div>
            </section>
            {products(id + "-p", t("home.bestsellers"), best.items, true)}
          </div>
        );
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
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card flex flex-col p-6">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-brand text-brand" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 flex-1 leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 text-sm"><span className="grid size-9 place-items-center rounded-full bg-brand-soft font-bold text-brand">{r.name.slice(0, 1)}</span><span><b>{r.name}</b>{r.city && <span className="text-muted"> · {r.city}</span>}</span></figcaption>
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

function SectionTitle({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="heading text-3xl sm:text-4xl">{title}</h2>
      {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: "ar" | "fr" | "en"; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="mx-auto max-w-7xl px-4 pt-3 sm:pt-6">
      <div className="grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-sunken p-6 sm:p-10 md:grid-cols-[1.05fr_1fr] md:p-14">
        <div>
          <span className="pill"><HomeIcon className="size-4 text-brand" />{t("home.rooms")}</span>
          <h1 className="heading mt-5 text-[clamp(2.4rem,6vw,4.6rem)]">{title}</h1>
          {sub && <p className="mt-4 max-w-md text-base text-muted md:text-lg">{sub}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={sl?.href || "/shop"} className="btn btn-primary btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
            {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg">{tr(sl.cta2, lang)}</Link>}
          </div>
        </div>
        {sl?.image && (
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] rounded-ee-[6rem] rtl:rounded-ee-[2rem] rtl:rounded-es-[6rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(sl.image)} alt="" className="aspect-[4/5] w-full object-cover md:aspect-[5/6]" loading="eager" fetchPriority="high" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
