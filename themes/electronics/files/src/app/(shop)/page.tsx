import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Zap } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";
import { techIcon } from "@/lib/goal-icon";

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
          <section key={id} className="mx-auto max-w-7xl px-4 pt-5">
            <ul className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3 bg-surface p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="size-5" aria-hidden /></span>
                    <span><span className="block text-sm font-bold">{tr(b.title, lang)}</span><span className="text-xs text-muted">{tr(b.text, lang)}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-7xl px-4 py-10">
            <SectionTitle title={t("home.shopTech")} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cats.map((c) => {
                const Icon = techIcon(`${c.slug} ${tr(c.name, lang)}`);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand hover:shadow-[0_14px_30px_-20px_var(--brand)]">
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-brand-ink"><Icon className="size-5" /></span>
                    <span><span className="block font-semibold leading-tight">{tr(c.name, lang)}</span><span className="mono text-xs text-muted">{c.count}</span></span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      case "featured":
        return products(id, t("home.featured"), featured.items);
      case "bestsellers":
        return products(id, t("home.bestsellers"), best.items);
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
          <section key={id} className="mx-auto max-w-7xl px-4 py-10">
            <SectionTitle title={t("home.reviews")} />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="card p-5">
                  <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-accent text-accent" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-3 text-sm font-semibold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
    }
    return null;
  };

  function products(id: string, title: string, items: typeof featured.items) {
    if (!items.length) return null;
    return (
      <section key={id} className="mx-auto max-w-7xl px-4 py-10">
        <SectionTitle title={title} href="/shop" more={t("home.viewAll")} />
        <div className="rail">{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</div>
      </section>
    );
  }

  return <>{sections.map((x) => render(x.id))}</>;
}

function SectionTitle({ title, href, more }: { title: string; href?: string; more?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="heading text-2xl sm:text-3xl"><span className="me-3 inline-block h-5 w-1.5 rounded-full bg-brand align-[-0.1em]" />{title}</h2>
      {href && <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: string; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="mx-auto max-w-7xl px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="panel-dark grid items-center gap-6 rounded-3xl px-5 py-9 sm:px-10 md:grid-cols-[1.1fr_1fr] md:py-14">
        <div className="relative">
          <span className="chip-spec !border-white/20 !bg-white/10 !text-accent"><Zap className="size-3" /> {t("cod.orderNow")}</span>
          <h1 className="heading mt-4 text-[clamp(2.2rem,6.5vw,4.4rem)]">{title}</h1>
          {sub && <p className="mt-4 max-w-md text-base text-white/75 md:text-lg">{sub}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={sl?.href || "/shop"} className="btn btn-primary btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
            {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border-white/25 bg-white/10 text-white hover:bg-white/20">{tr(sl.cta2, lang)}</Link>}
          </div>
        </div>
        {sl?.image && (
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-white/10 shadow-[0_30px_80px_-30px_var(--brand)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(sl.image)} alt="" className="size-full object-cover" loading="eager" fetchPriority="high" />
          </div>
        )}
      </div>
    </section>
  );
}
