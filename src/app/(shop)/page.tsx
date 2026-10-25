import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";

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
        return <Hero key={id} s={s} lang={lang} t={t} picks={featured.items.slice(0, 3)} ticker={t("home.ticker")} />;
      case "trust":
        return (
          <section key={id} className="mx-auto max-w-[88rem] px-4 py-8">
            <ul className="grid gap-3 md:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="cut flex items-center gap-4 bg-surface p-4">
                    <span className="grid size-12 shrink-0 -skew-x-12 place-items-center bg-[#0d0d0d] text-[var(--lime)]"><Icon className="size-6 skew-x-12" aria-hidden /></span>
                    <span><span className="heading block text-lg">{tr(b.title, lang)}</span><span className="text-sm text-muted">{tr(b.text, lang)}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto max-w-[88rem] px-4 py-10">
            <SectionTitle title={t("home.types")} />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {cats.map((c, i) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="cut group relative block aspect-[4/5] overflow-hidden bg-sunken">
                  {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/85 to-transparent p-3 pt-16 text-white">
                    <span className="heading text-xl leading-none sm:text-2xl"><span className="num block text-sm not-italic text-[var(--lime)]">{String(i + 1).padStart(2, "0")}</span>{tr(c.name, lang)}</span>
                    <span aria-hidden className="grid size-9 shrink-0 -skew-x-12 place-items-center bg-[var(--lime)] text-[#0d0d0d] transition group-hover:translate-x-1"><ArrowRight className="size-5 skew-x-12 rtl:rotate-180" /></span>
                  </span>
                </Link>
              ))}
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
          <section key={id} className="mx-auto max-w-[88rem] px-4 py-12">
            <SectionTitle title={t("home.reviews")} />
            <div className="grid gap-4 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="cut flex flex-col bg-surface p-5">
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-[#0d0d0d] text-[#0d0d0d] dark:fill-[var(--lime)] dark:text-[var(--lime)]" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 flex-1 text-[1.02rem] font-medium leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="heading mt-4 text-base">{r.name}{r.city && <span className="font-body text-sm font-normal normal-case not-italic text-muted"> · {r.city}</span>}</figcaption>
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
      <section key={id} className="mx-auto max-w-[88rem] px-4 py-10">
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
      <h2 className="heading text-[clamp(2rem,6vw,3.6rem)]"><span className="marker">{title}</span></h2>
      {href && <Link href={href} className="btn btn-outline btn-sm shrink-0">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t, picks, ticker }: { s: Awaited<ReturnType<typeof getSettings>>; lang: "ar" | "fr" | "en"; t: ReturnType<typeof import("@/lib/dict").makeT>; picks: { id: string; slug: string; image: string | null }[]; ticker: string }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  const words = title.split(" ");
  const last = words.length > 1 ? words.pop()! : "";
  const rot = ["-rotate-3", "rotate-2", "-rotate-1"];
  return (
    <section>
      <div className="relative overflow-hidden bg-[#0d0d0d] text-white">
        <span aria-hidden className="absolute -end-20 top-0 h-full w-1/3 skew-x-[-14deg] bg-[var(--lime)] opacity-95 rtl:skew-x-[14deg]" />
        <div className="relative mx-auto grid max-w-[88rem] items-center gap-8 px-5 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <p className="tag"><span>{s.store.name}</span></p>
            <h1 className="heading mt-5 text-[clamp(3.2rem,11vw,8rem)]">{words.join(" ")}{last && <> <span className="marker">{last}</span></>}</h1>
            {sub && <p className="mt-5 max-w-md text-base text-white/75 md:text-lg">{sub}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={sl?.href || "/shop"} className="btn btn-accent btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
              {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border-2 border-white/60 text-white hover:bg-white/10">{tr(sl.cta2, lang)}</Link>}
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3">
            {picks.length >= 3 ? picks.map((p, i) => (
              <Link key={p.id} href={`/p/${p.slug}`} className={`cut block overflow-hidden bg-white shadow-[8px_8px_0_#0d0d0d] transition hover:rotate-0 ${rot[i]} ${i === 0 ? "col-span-2 mx-auto w-4/5" : ""}`}>
                {p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(p.image)} alt="" className="aspect-[4/3] w-full object-cover" loading="eager" />}
              </Link>
            )) : sl?.image && (
              <div className="cut col-span-2 overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={fileUrl(sl.image)} alt="" className="aspect-square w-full object-cover" loading="eager" fetchPriority="high" /></div>
            )}
          </div>
        </div>
      </div>
      <div className="ticker heading !not-italic py-2 text-lg" aria-hidden>
        <div className="ticker-track">{[0, 1, 2, 3].map((k) => <span key={k} className="px-6">{ticker} <span className="px-3">{"///"}</span></span>)}</div>
      </div>
    </section>
  );
}
