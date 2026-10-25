import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { metalGradient } from "@/lib/swatch";

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
          <section key={id} className="mx-auto max-w-6xl px-4 py-10">
            <ul className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex flex-col items-center gap-2 px-6 py-6 text-center">
                    <Icon className="size-6 text-[var(--champagne)]" strokeWidth={1.2} aria-hidden />
                    <span className="caps">{tr(b.title, lang)}</span>
                    <span className="text-sm text-muted">{tr(b.text, lang)}</span>
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
            <section className="mx-auto max-w-[88rem] px-4 py-10 md:px-6">
              <SectionTitle eyebrow={t("home.crafted")} title={t("home.collections")} />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-5">
                {cats.map((c, i) => (
                  <Link key={c.id} href={`/category/${c.slug}`} className={`group relative block overflow-hidden bg-sunken ${i < 2 ? "col-span-1 md:col-span-3" : "col-span-1 md:col-span-2"} ${i === 4 ? "col-span-2 md:col-span-2" : ""}`}>
                    <div className={`${i < 2 ? "aspect-[4/5] md:aspect-[4/3]" : i === 4 ? "aspect-[16/9] md:aspect-[4/3]" : "aspect-[4/5] md:aspect-[4/3]"}`}>
                      {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />}
                    </div>
                    <span className="absolute inset-x-0 bottom-0 flex flex-col items-center bg-gradient-to-t from-black/60 to-transparent px-3 pb-5 pt-14 text-white"><span className="heading text-xl sm:text-2xl">{tr(c.name, lang)}</span><span className="caps mt-1 border-b border-[var(--champagne)] pb-0.5 text-[0.65rem] opacity-90">{t("home.viewAll")}</span></span>
                  </Link>
                ))}
              </div>
            </section>
            <section className="mx-auto max-w-4xl px-4 py-12 text-center">
              <p className="caps gold mb-6">{t("home.metals")}</p>
              <ul className="flex flex-wrap justify-center gap-x-10 gap-y-6">
                {METALS.map((m) => { const n = m.label[lang === "fr" ? 1 : lang === "ar" ? 2 : 0]; return (
                  <li key={m.q}><Link href={`/shop?q=${encodeURIComponent(m.q)}`} className="group flex flex-col items-center gap-3">
                    <span className="size-16 rounded-full border border-line shadow-[inset_0_0_0_3px_#fff] transition group-hover:scale-110 sm:size-20" style={{ background: metalGradient(m.q) ?? m.fallback }} />
                    <span className="caps">{n}</span>
                  </Link></li>
                ); })}
              </ul>
            </section>
          </div>
        );
      case "featured":
        return products(id, t("home.featured"), featured.items);
      case "bestsellers":
        return (
          <div key={id}>
            {products(id + "-b", t("home.bestsellers"), best.items, true)}
            <section className="spot mt-6">
              <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center md:py-24">
                <p className="caps gold">{t("p.giftBox")}</p>
                <h2 className="heading mt-4 text-[clamp(2rem,5vw,3.4rem)]">{t("home.crafted")}</h2>
                <Link href="/shop" className="btn btn-lg mt-8 border border-[var(--champagne)] text-[#f4efe6] hover:!bg-[var(--champagne)] hover:!text-[#111]">{t("home.shopNow")}</Link>
              </div>
            </section>
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
          <section key={id} className="mx-auto max-w-6xl px-4 py-16">
            <SectionTitle eyebrow="★★★★★" title={t("home.reviews")} />
            <div className="grid gap-10 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="text-center">
                  <blockquote className="heading text-[1.25rem] leading-snug">“{r.body}”</blockquote>
                  <hr className="hair mx-auto my-5 w-16" />
                  <figcaption className="caps text-muted">{r.name}{r.city && <> · {r.city}</>}</figcaption>
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
      <section key={id} className="mx-auto max-w-[88rem] px-4 py-12 md:px-6">
        <SectionTitle title={title} href="/shop" more={t("home.viewAll")} />
        {rail ? <div className="rail">{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</div> : <ProductGrid>{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={s.checkout.codMode} />)}</ProductGrid>}
      </section>
    );
  }

  return <>{sections.map((x) => render(x.id))}</>;
}

const METALS: { q: string; label: [string, string, string]; fallback: string }[] = [
  { q: "Gold", label: ["Gold", "Or", "ذهبي"], fallback: "#d4af37" }, { q: "Silver", label: ["Silver", "Argent", "فضي"], fallback: "#c3c6cc" },
  { q: "Steel", label: ["Steel", "Acier", "ستانلس"], fallback: "#aab1ba" }, { q: "Pearl", label: ["Pearl", "Perle", "لؤلؤ"], fallback: "#f6efe3" },
];

function SectionTitle({ title, href, more, eyebrow }: { title: string; href?: string; more?: string; eyebrow?: string }) {
  return (
    <div className="mb-10 text-center">
      {eyebrow && <p className="caps gold mb-3">{eyebrow}</p>}
      <h2 className="heading text-[clamp(2rem,5vw,3rem)]">{title}</h2>
      <hr className="hair mx-auto mt-5 w-24" />
      {href && <Link href={href} className="caps mt-4 inline-flex items-center gap-1 underline-offset-8 hover:underline">{more} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>}
    </div>
  );
}

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: "ar" | "fr" | "en"; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="spot">
      <div className="relative mx-auto grid max-w-[88rem] items-center gap-10 px-6 py-14 md:grid-cols-[1.1fr_1fr] md:py-24">
        <div className="text-center md:text-start">
          <p className="caps gold">{s.store.name}</p>
          <h1 className="heading mt-5 text-[clamp(2.6rem,7vw,5.4rem)]">{title}</h1>
          {sub && <p className="mx-auto mt-6 max-w-md text-base text-[#d8d0c0] md:mx-0 md:text-lg">{sub}</p>}
          <div className="mt-9 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href={sl?.href || "/shop"} className="btn btn-accent btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")}</Link>
            {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border border-white/40 text-white hover:bg-white/10">{tr(sl.cta2, lang)}</Link>}
          </div>
        </div>
        {sl?.image && (
          <div className="relative mx-auto w-full max-w-sm">
            <span aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 border border-[var(--champagne)] rtl:-translate-x-4" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(sl.image)} alt="" className="relative aspect-[4/5] w-full object-cover" loading="eager" fetchPriority="high" />
          </div>
        )}
      </div>
    </section>
  );
}
