import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, Star, Leaf } from "lucide-react";
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
        return <Hero key={id} s={s} lang={lang} t={t} picks={featured.items.slice(0, 3)} />;
      case "trust":
        return (
          <section key={id} className="mt-8 border-y-2 border-ink bg-[var(--mustard)] text-[#1f2a1c]">
            <ul className="mx-auto grid max-w-7xl gap-x-6 gap-y-3 px-4 py-4 sm:grid-cols-3">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[#1f2a1c] bg-[#fffaf0]"><Icon className="size-5" aria-hidden /></span>
                    <span><span className="block font-extrabold leading-tight">{tr(b.title, lang)}</span><span className="text-sm font-medium opacity-80">{tr(b.text, lang)}</span></span>
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
            <SectionTitle title={t("home.fromProducers")} />
            <div className="grid grid-cols-2 gap-4 pe-1.5 md:grid-cols-4">
              {cats.map((c, i) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="sticker group relative block aspect-[4/5] overflow-hidden transition hover:-translate-y-0.5">
                  {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />}
                  <span className={`heading absolute inset-x-0 bottom-0 flex items-center justify-between border-t-2 border-ink px-3 py-2.5 text-lg ${i % 2 ? "bg-[var(--mustard)] text-[#1f2a1c]" : "bg-surface"}`}>{tr(c.name, lang)}<span aria-hidden className="rtl:rotate-180">→</span></span>
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              <span className="heading text-xl">{t("home.diets")}</span>
              {DIETS.map((d) => { const n = d[lang === "fr" ? 1 : lang === "ar" ? 2 : 0]; return <Link key={d[0]} href={`/shop?q=${encodeURIComponent(n)}`} className="tag !px-3.5 !py-1.5 !text-sm hover:bg-[var(--mustard)] hover:text-[#1f2a1c]">{n}</Link>; })}
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
            <div className="grid gap-5 pe-1.5 md:grid-cols-3">
              {reviews.slice(0, 3).map((r, i) => (
                <figure key={r.id} className={`sticker flex flex-col p-5 ${i === 1 ? "md:-rotate-1" : i === 2 ? "md:rotate-1" : ""}`}>
                  <div className="flex gap-0.5" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-[var(--mustard)] text-ink" : "text-line"}`} />)}</div>
                  <blockquote className="mt-3 flex-1 font-medium leading-relaxed">“{r.body}”</blockquote>
                  <figcaption className="mt-3 text-sm font-extrabold">{r.name}{r.city && <span className="font-medium text-muted"> · {r.city}</span>}</figcaption>
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
      <h2 className="heading text-[clamp(1.8rem,4.5vw,2.8rem)]"><span className="mark">{title}</span></h2>
      {href && <Link href={href} className="btn btn-outline btn-sm shrink-0">{more} <ArrowRight className="size-4 rtl:rotate-180" /></Link>}
    </div>
  );
}

const DIETS: [string, string, string][] = [["Vegan", "Vegan", "نباتي"], ["Gluten-free", "Sans gluten", "خالٍ من الغلوتين"], ["Organic", "Bio", "عضوي"], ["No added sugar", "Sans sucres ajoutés", "بدون سكر مضاف"]];

function Hero({ s, lang, t, picks }: { s: Awaited<ReturnType<typeof getSettings>>; lang: "ar" | "fr" | "en"; t: ReturnType<typeof import("@/lib/dict").makeT>; picks: { id: string; slug: string; image: string | null }[] }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  const words = title.split(" ");
  const last = words.length > 2 ? words.pop()! : "";
  const rot = ["-rotate-6", "rotate-3", "-rotate-2"];
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:pt-10">
      <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="tag !bg-[var(--mustard)] !text-[#1f2a1c]"><Leaf className="size-3.5" />{t("home.sticker")}</span>
          <h1 className="heading mt-4 text-[clamp(2.6rem,7.5vw,5.2rem)]">{words.join(" ")}{last && <> <span className="mark">{last}</span></>}</h1>
          {sub && <p className="mt-5 max-w-md text-base font-medium text-muted md:text-lg">{sub}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={sl?.href || "/shop"} className="btn btn-primary btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")} <ArrowRight className="size-5 rtl:rotate-180" /></Link>
            {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg">{tr(sl.cta2, lang)}</Link>}
          </div>
        </div>
        <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 pe-1.5">
          {picks.length >= 3 ? picks.map((p, i) => (
            <Link key={p.id} href={`/p/${p.slug}`} className={`sticker block overflow-hidden transition hover:rotate-0 ${rot[i]} ${i === 0 ? "col-span-2 mx-auto w-3/4" : ""}`}>
              {p.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(p.image)} alt="" className="aspect-square w-full object-cover" loading="eager" />}
            </Link>
          )) : sl?.image && (
            <div className="sticker col-span-2 overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={fileUrl(sl.image)} alt="" className="aspect-square w-full object-cover" loading="eager" fetchPriority="high" /></div>
          )}
        </div>
      </div>
    </section>
  );
}
