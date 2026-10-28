import Link from "next/link";
import { ArrowRight, Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem } from "lucide-react";
import { getSettings, type TrustBadge } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard } from "@/features/catalog/components/product-card";
import { scentIcon } from "@/lib/goal-icon";

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
          <section key={id} className="mx-auto max-w-5xl px-4 py-8">
            <ul className="grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
              {s.trust.map((b, i) => {
                const Icon = ICONS[b.icon] ?? ShieldCheck;
                return (
                  <li key={i} className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
                    <Icon className="size-5 text-[var(--gold)]" strokeWidth={1.5} aria-hidden />
                    <span className="eyebrow !text-ink">{tr(b.title, lang)}</span>
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
          <section key={id} className="mx-auto max-w-7xl px-4 py-12">
            <SectionTitle eyebrow={t("home.discover")} title={t("home.families")} />
            <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:gap-8 md:overflow-visible md:px-0">
              {cats.map((c) => {
                const Icon = scentIcon(`${c.slug} ${tr(c.name, lang)}`);
                return (
                  <Link key={c.id} href={`/category/${c.slug}`} className="group flex w-32 shrink-0 flex-col items-center gap-3 text-center md:w-auto">
                    <span className="relative block aspect-square w-full overflow-hidden rounded-full border border-[var(--gold)] p-1.5">
                      <span className="block size-full overflow-hidden rounded-full bg-sunken">
                        {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-110" />}
                      </span>
                      <span className="absolute bottom-1 end-1 grid size-8 place-items-center rounded-full bg-[var(--panel)] text-[var(--gold)]"><Icon className="size-4" strokeWidth={1.5} /></span>
                    </span>
                    <span className="heading text-lg leading-tight">{tr(c.name, lang)}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-12">
              <p className="gold-rule eyebrow mb-5"><span>{t("home.byNote")}</span></p>
              <div className="flex flex-wrap justify-center gap-2">
                {NOTES.map((n) => <Link key={n[0]} href={`/shop?q=${encodeURIComponent(n[lang === "fr" ? 1 : lang === "ar" ? 2 : 0])}`} className="note">{n[lang === "fr" ? 1 : lang === "ar" ? 2 : 0]}</Link>)}
              </div>
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
          <section key={id} className="mx-auto max-w-6xl px-4 py-14">
            <SectionTitle eyebrow="★★★★★" title={t("home.reviews")} />
            <div className="grid gap-10 md:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r.id} className="text-center">
                  <blockquote className="heading text-[1.35rem] italic leading-snug">“{r.body}”</blockquote>
                  <figcaption className="eyebrow mt-4 !text-muted">{r.name}{r.city && <> · {r.city}</>}</figcaption>
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

function SectionTitle({ title, href, more, eyebrow }: { title: string; href?: string; more?: string; eyebrow?: string }) {
  return (
    <div className="mb-8 text-center">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="heading text-[clamp(2rem,5vw,3rem)]">{title}</h2>
      {href && <Link href={href} className="eyebrow mt-3 inline-flex items-center gap-1 !text-ink underline-offset-8 hover:underline">{more} <ArrowRight className="size-3.5 rtl:rotate-180" /></Link>}
    </div>
  );
}

const NOTES: [string, string, string][] = [["Rose", "Rose", "ورد"], ["Vanilla", "Vanille", "فانيليا"], ["Cedar", "Cèdre", "أرز"], ["Bergamot", "Bergamote", "برغموت"], ["Jasmine", "Jasmin", "ياسمين"], ["Musk", "Musc", "مسك"], ["Amber", "Ambre", "عنبر"], ["Lavender", "Lavande", "لافندر"]];

function Hero({ s, lang, t }: { s: Awaited<ReturnType<typeof getSettings>>; lang: string; t: ReturnType<typeof import("@/lib/dict").makeT> }) {
  const sl = s.hero.slides[0];
  const title = sl ? tr(sl.title, lang) : s.store.name;
  const sub = sl ? tr(sl.sub, lang) : tr(s.store.tagline, lang);
  return (
    <section className="panel-plum">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 md:grid-cols-[1.1fr_1fr] md:py-20">
        <div className="text-center md:text-start">
          <p className="eyebrow">{s.store.name}</p>
          <h1 className="heading mt-4 text-[clamp(2.6rem,7vw,5.2rem)] italic">{title}</h1>
          {sub && <p className="mx-auto mt-5 max-w-md text-base text-white/75 md:mx-0 md:text-lg">{sub}</p>}
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link href={sl?.href || "/shop"} className="btn btn-accent btn-lg">{(sl && tr(sl.cta, lang)) || t("home.shopNow")}</Link>
            {sl?.cta2 && tr(sl.cta2, lang) && <Link href={sl.href2 || "/shop"} className="btn btn-lg border-white/40 text-white hover:bg-white/10">{tr(sl.cta2, lang)}</Link>}
          </div>
        </div>
        {sl?.image && (
          <div className="mx-auto w-full max-w-sm">
            <div className="overflow-hidden rounded-t-[999px] border border-[var(--gold)] p-2"><div className="overflow-hidden rounded-t-[999px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(sl.image)} alt="" className="aspect-[4/5] w-full object-cover" loading="eager" fetchPriority="high" />
            </div></div>
          </div>
        )}
      </div>
    </section>
  );
}
