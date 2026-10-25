import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, PawPrint } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { petIcon } from "@/lib/goal-icon";

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
                  <li key={i} className="flex items-center gap-3 rounded-full border-2 border-line bg-surface p-2 pe-5">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-brand-ink"><Icon className="size-6" aria-hidden /></span>
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
          <section key={id} className="mx-auto max-w-7xl px-4 py-12">
            <SectionTitle title={t("home.byPet")} sub={t("home.byPetD")} />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {cats.map((c, i) => {
                const Icon = petIcon(`${c.slug} ${tr(c.name, lang)}`);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className="group relative block overflow-hidden rounded-[2rem] border-2 border-line bg-sunken transition hover:-translate-y-1 hover:border-[var(--paw)]">
                    <div className="aspect-[4/5] overflow-hidden">{c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}</div>
                    <span className={`heading absolute inset-x-2.5 bottom-2.5 flex items-center justify-between rounded-full bg-surface p-1.5 ps-4 text-lg ${i % 2 ? "" : ""}`}>{tr(c.name, lang)}<span className="grid size-9 place-items-center rounded-full bg-[var(--paw)] text-[#2b1608]"><Icon className="size-5" /></span></span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <span className="heading text-lg">{t("home.stages")}</span>
              {STAGES.map((x) => { const n = x[lang === "fr" ? 1 : lang === "ar" ? 2 : 0]; return <Link key={x[0]} href={`/shop?q=${encodeURIComponent(x[0])}`} className="pill hover:bg-brand hover:text-brand-ink">{n}</Link>; })}
            </div>
          </section>
        );
      case "featured":
        return products(id, t("home.featured"), featured.items);
      case "bestsellers":
        return (
          <div key={id}>
            <section className="mx-auto max-w-7xl px-4 py-6">
              <div className="paws flex flex-col items-start justify-between gap-4 rounded-[2.5rem] bg-[var(--paw)] p-7 text-[#2b1608] sm:flex-row sm:items-center sm:p-10">
                <div><p className="heading text-2xl sm:text-3xl">{t("home.perks")}</p><p className="mt-1 font-semibold opacity-85">{t("home.bundle")}</p></div>
                <Link href="/shop" className="btn btn-lg shrink-0 bg-[#2b2118] text-white hover:bg-[#3d3025]">{t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
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
                <figure key={r.id} className="card flex flex-col border-2 p-6">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-5 ${i < r.rating ? "fill-[var(--paw)] text-[var(--paw)]" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 flex-1 leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3 text-sm"><span className="grid size-9 place-items-center rounded-full bg-brand text-brand-ink"><PawPrint className="size-4" /></span><span><b>{r.name}</b>{r.city && <span className="text-muted"> · {r.city}</span>}</span></figcaption>
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

const STAGES: [string, string, string][] = [["Adult", "Adulte", "بالغ"], ["All ages", "Tous âges", "كل الأعمار"], ["Large breeds", "Grandes races", "السلالات الكبيرة"]];

function SectionTitle({ title, sub, href, more }: { title: string; sub?: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0"><h2 className="heading text-[clamp(1.8rem,5vw,2.8rem)]">{title}</h2>{sub && <p className="mt-1 text-muted">{sub}</p>}</div>
      {href && <Link href={href} className="btn btn-outline btn-sm shrink-0">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: "ar" | "fr" | "en"; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 sm:pt-5">
      <div className="paws relative overflow-hidden rounded-[2.5rem] bg-sunken px-6 py-10 sm:px-12 md:py-16">
        <div className="relative grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <span className="petag text-sm"><PawPrint className="size-4" />{s.store.name}</span>
            <h1 className="heading mt-5 text-[clamp(2.5rem,6.5vw,4.8rem)]">{title}</h1>
            {sub && <p className="mt-4 max-w-md text-base font-medium text-muted md:text-lg">{sub}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={sl?.href || "/shop"} className="btn btn-primary btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
              {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg">{tr(sl.cta2, lang)}</Link>}
            </div>
          </div>
          {sl?.image && (
            <div className="relative mx-auto w-full max-w-sm">
              <div className="blob overflow-hidden border-[10px] border-surface bg-surface shadow-[0_26px_50px_-28px_rgb(43_33_24/.55)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl(sl.image)} alt="" className="aspect-[4/5] w-full object-cover" loading="eager" fetchPriority="high" />
              </div>
              <span className="pill absolute -bottom-3 start-4 bg-surface shadow"><PawPrint className="size-4 text-[var(--paw)]" />{t("home.byPetD")}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
