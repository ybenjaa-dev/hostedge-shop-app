import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Gauge, CarFront } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { CarFinder } from "@/features/catalog/components/car-select";
import { CARS } from "@/lib/fitment";
import { autoIcon } from "@/lib/goal-icon";

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
            <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3 bg-surface p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand text-brand-ink"><Icon className="size-5" aria-hidden /></span>
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
            <SectionTitle title={t("home.needs")} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {cats.map((c) => {
                const Icon = autoIcon(`${c.slug} ${tr(c.name, lang)}`);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className="group relative block aspect-[5/4] overflow-hidden rounded-xl bg-[#12161c]">
                    {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover opacity-90 transition duration-500 group-hover:scale-105" />}
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10 text-white"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--brand)]"><Icon className="size-4" /></span><span className="heading text-base sm:text-lg">{tr(c.name, lang)}</span></span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="label me-1">{t("home.popularMakes")}</span>
              {Object.keys(CARS).slice(0, 8).map((m) => <Link key={m} href={`/shop?q=${encodeURIComponent(m)}`} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold hover:border-[var(--brand)] hover:text-brand">{m}</Link>)}
            </div>
          </section>
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
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card flex flex-col border-s-4 !border-s-[var(--brand)] p-5">
                  <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-[var(--brand)] text-[var(--brand)]" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 flex-1 leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-3 text-sm font-bold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</figcaption>
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
      <h2 className="heading text-2xl sm:text-3xl"><span className="me-3 inline-block h-5 w-1.5 -skew-x-12 rounded-sm bg-brand align-[-0.1em]" />{title}</h2>
      {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: string; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 sm:pt-5">
      <div className="carbon rounded-2xl px-5 py-9 sm:px-10 md:py-14">
        <div className="relative grid items-center gap-8 md:grid-cols-[1.15fr_1fr]">
          <div>
            <span className="chip"><Gauge className="size-3.5" />{s.store.name}</span>
            <h1 className="heading mt-4 text-[clamp(2.3rem,6vw,4.4rem)]">{title}</h1>
            {sub && <p className="mt-4 max-w-md text-base text-white/75 md:text-lg">{sub}</p>}
            <div className="mt-6 rounded-xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm">
              <p className="heading mb-3 flex items-center gap-2 text-lg"><CarFront className="size-5 text-[var(--brand)]" />{t("home.findCar")}</p>
              <CarFinder labels={{ make: t("home.make"), model: t("home.model"), all: t("home.allModels"), go: t("home.findBtn") }} />
              <Link href="/shop?q=Universal" className="mt-3 inline-block text-sm font-semibold text-white/80 underline-offset-4 hover:underline">{t("p.universal")} →</Link>
            </div>
          </div>
          {sl?.image && (
            <div className="relative mx-auto hidden w-full max-w-sm md:block">
              <div className="overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_70px_-30px_var(--brand)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(sl.image)} alt="" className="aspect-[4/5] w-full object-cover" loading="eager" fetchPriority="high" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
