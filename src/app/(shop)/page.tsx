import Link from "next/link";
import { ArrowRight, ArrowLeft, Star, Sprout, Truck, Banknote } from "lucide-react";
import { getSettings, type Settings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr, dirOf, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { TFn } from "@/lib/dict";
import { listCategories, listProducts, listReviews } from "@/features/catalog/queries";
import { ProductCard, ProductGrid } from "@/features/catalog/components/product-card";
import { Sprig, Monstera, Squiggle, Sparkle, Dots } from "@/components/botanical";

const BLOBS = ["blob", "blob-2", "blob-3", "blob-2", "blob"];
const NOTE_BG = ["bg-sun", "bg-mint", "bg-blush", "bg-sky"];

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
  const codMode = s.checkout.codMode;
  const Arrow = dirOf(lang) === "rtl" ? ArrowLeft : ArrowRight;

  const heading = (title: string, kicker?: string, href = "/shop") => (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="relative">
        {kicker && <p className="sticker mb-2">{kicker}</p>}
        <h2 className="display text-3xl sm:text-5xl"><span className="relative inline-block">{title}<Squiggle className="absolute inset-x-0 -bottom-2 h-2.5 text-coral" /></span></h2>
      </div>
      <Link href={href} className="btn btn-outline btn-sm shrink-0">{t("home.viewAll")}<Arrow className="size-4" /></Link>
    </div>
  );

  const render = (id: string) => {
    switch (id) {
      case "hero":
        return <HeroBlock key={id} s={s} lang={lang} t={t} />;
      case "trust":
        return <Ribbon key={id} items={s.trust.map((b) => tr(b.title, lang))} />;
      case "categories":
        if (!cats.length) return null;
        return (
          <section key={id} className="mx-auto mt-16 max-w-[78rem] px-4">
            {heading(t("home.categories"), t("home.pickYours"))}
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {cats.map((c, i) => (
                <Link key={c.id} href={`/category/${c.slug}`} className="group flex flex-col items-center gap-3 text-center">
                  <span className={`relative block aspect-square w-full overflow-hidden border-2 border-edge bg-mint shadow-[5px_5px_0_var(--edge)] transition duration-200 group-hover:-translate-y-1 group-hover:rotate-[-2deg] group-hover:shadow-[8px_9px_0_var(--edge)] ${BLOBS[i % BLOBS.length]}`}>
                    {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="size-full object-cover" />}
                  </span>
                  <span className="chip !bg-surface !text-base group-hover:!bg-sun group-hover:!text-[#1f3d2b]">{tr(c.name, lang)}<span className="num rounded-full bg-ink/10 px-1.5 text-xs">{c.count}</span></span>
                </Link>
              ))}
            </div>
          </section>
        );
      case "featured":
        if (!featured.items.length) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-[78rem] px-4">
            {heading(t("home.featured"), t("home.growing"))}
            <ProductGrid bento>{featured.items.slice(0, 7).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} big={i === 0} priority={i < 2} />)}</ProductGrid>
          </section>
        );
      case "bestsellers":
        if (!best.items.length) return null;
        return (
          <section key={id} className="relative mt-20 border-y-2 border-edge bg-mint/70 py-12">
            <Sprig className="pointer-events-none absolute end-6 top-4 hidden w-16 rotate-12 text-[#4fa86b] md:block" />
            <div className="mx-auto max-w-[78rem] px-4">
              {heading(t("home.bestsellers"), t("home.rank"))}
              <div className="rail">{best.items.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} lang={lang} t={t} currency={cur} codMode={codMode} rank={i + 1} />)}</div>
            </div>
          </section>
        );
      case "banner":
        if (!s.home.banner.image) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-[78rem] px-4">
            <Link href={s.home.banner.href || "/shop"} className="nb relative block overflow-hidden !rounded-[2.5rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(s.home.banner.image)} alt={tr(s.home.banner.title, lang)} loading="lazy" className="aspect-[16/6] min-h-40 w-full object-cover" />
              <span className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-[#1f3d2b]/85 to-transparent p-6 text-white rtl:bg-gradient-to-l md:p-12"><span className="display text-3xl md:text-5xl">{tr(s.home.banner.title, lang)}</span><span className="mt-2 max-w-md">{tr(s.home.banner.sub, lang)}</span></span>
            </Link>
          </section>
        );
      case "reviews":
        if (!reviews.length) return null;
        return (
          <section key={id} className="mx-auto mt-20 max-w-[78rem] px-4">
            <h2 className="display mb-8 text-center text-3xl sm:text-5xl">{t("home.reviews")}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.slice(0, 3).map((r, i) => (
                <figure key={r.id} className={`sticky-note p-5 ${NOTE_BG[i % NOTE_BG.length]} text-[#1f3d2b]`} style={{ transform: `rotate(${[-1.8, 1.2, -0.8][i % 3]}deg)` }}>
                  <div className="flex gap-0.5" role="img" aria-label={`${r.rating}/5`}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} className={`size-4 ${k < r.rating ? "fill-[#ff6b4a] text-[#1f3d2b]" : "text-[#1f3d2b]/30"}`} />)}</div>
                  <blockquote className="mt-3 text-lg leading-snug">“{r.body}”</blockquote>
                  <figcaption className="display mt-3 text-base">{r.name}{r.city && <span className="font-sans text-sm font-normal opacity-70"> · {r.city}</span>}</figcaption>
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
  nodes.splice(Math.max(0, heroIdx + 3), 0, <HowItWorks key="how" t={t} codMode={codMode} />);
  return <div className="pb-6">{nodes}</div>;
}

/** Sticker-tape ribbon: slow marquee of the store's promises. */
function Ribbon({ items }: { items: string[] }) {
  const list = [...items, ...items, ...items, ...items].filter(Boolean);
  if (!list.length) return null;
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-6 pe-6" aria-hidden={hidden || undefined}>
      {list.map((x, i) => <li key={i} className="display flex items-center gap-6 whitespace-nowrap text-lg">{x}<Sparkle className="size-5" fill={i % 2 ? "#ff6b4a" : "#fffdf6"} /></li>)}
    </ul>
  );
  return (
    <div className="my-12 -rotate-1 border-y-2 border-edge bg-sun py-3 text-[#1f3d2b] shadow-[0_5px_0_var(--edge)]">
      <div className="marquee"><div className="marquee-track">{row(false)}{row(true)}</div></div>
    </div>
  );
}

function HowItWorks({ t, codMode }: { t: TFn; codMode: boolean }) {
  if (!codMode) return null;
  const steps = [[t("how.s1"), t("how.s1d")], [t("how.s2"), t("how.s2d")], [t("how.s3"), t("how.s3d")]];
  const bg = ["bg-sun", "bg-coral text-white", "bg-mint"];
  return (
    <section className="mx-auto mt-20 max-w-[78rem] px-4">
      <h2 className="display mb-10 text-center text-3xl sm:text-5xl"><span className="relative inline-block">{t("how.title")}<Squiggle className="absolute inset-x-0 -bottom-2 h-2.5 text-coral" /></span></h2>
      <ol className="relative grid gap-8 md:grid-cols-3">
        <span className="pointer-events-none absolute inset-x-[16%] top-8 hidden border-t-[3px] border-dashed border-edge md:block" aria-hidden />
        {steps.map(([title, text], i) => (
          <li key={i} className="relative flex flex-col items-center text-center">
            <span className={`display num relative z-10 grid size-16 place-items-center rounded-full border-2 border-edge text-3xl shadow-[4px_4px_0_var(--edge)] ${bg[i]} ${i === 1 ? "text-white" : "text-[#1f3d2b]"}`}>{i + 1}</span>
            <div className="nb mt-4 w-full p-5"><h3 className="display text-xl">{title}</h3><p className="mt-1 text-muted">{text}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Headline({ text, as: H }: { text: string; as: "h1" | "h2" }) {
  const parts = text.split(/\*(.+?)\*/g);
  return (
    <H className="display text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-7xl">
      {parts.map((p, i) => i % 2 ? <span key={i} className="relative inline-block whitespace-nowrap text-coral">{p}<Squiggle className="absolute inset-x-0 -bottom-2 h-3 text-sun" /></span> : <span key={i}>{p}</span>)}
    </H>
  );
}

/** Big headline on one side, a blob-masked plant picture with floating stickers on the other. */
function HeroBlock({ s, lang, t }: { s: Settings; lang: Lang; t: TFn }) {
  const Arrow = dirOf(lang) === "rtl" ? ArrowLeft : ArrowRight;
  const slides = s.hero.slides.length ? s.hero.slides : [{ image: "", title: { [lang]: s.store.name } as Record<string, string>, sub: s.store.tagline, cta: { [lang]: t("home.hero.cta") } as Record<string, string>, href: "/shop" }];
  return (
    <section className="relative mx-auto max-w-[78rem] overflow-x-clip px-4 pt-4 md:pt-8" aria-roledescription="carousel">
      <div className={slides.length > 1 ? "scroll-snap-x flex gap-6 py-3" : "py-3"}>
        {slides.map((sl, i) => (
          <div key={i} className="grid items-center gap-8 md:grid-cols-[1.05fr_.95fr] md:gap-12" aria-roledescription="slide">
            <div className="relative order-2 md:order-1">
              <p className="sticker mb-4"><Sprout className="size-4" aria-hidden />{t("home.heroTag")}</p>
              <Headline text={tr(sl.title, lang)} as={i === 0 ? "h1" : "h2"} />
              <p className="mt-5 max-w-lg text-lg text-muted">{tr(sl.sub, lang)}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {tr(sl.cta, lang) && <Link href={sl.href || "/shop"} className="btn btn-primary btn-lg">{tr(sl.cta, lang)}<Arrow className="size-5" /></Link>}
                {"cta2" in sl && sl.cta2 && tr(sl.cta2, lang) ? <Link href={sl.href2 || "/shop"} className="btn btn-outline btn-lg">{tr(sl.cta2, lang)}</Link> : <Link href="/shop" className="btn btn-outline btn-lg">{t("home.heroCta2")}</Link>}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="sticker coral"><Banknote className="size-4" aria-hidden />{t("cod.payOnDelivery")}</span>
                <span className="sticker mint"><Truck className="size-4" aria-hidden />{t("trust.delivery")}</span>
              </div>
            </div>
            <div className="relative order-1 mx-auto w-full max-w-[26rem] md:order-2 md:max-w-none">
              <Dots className="absolute -start-4 bottom-6 w-16 text-edge/50" />
              <div className="blob relative aspect-square overflow-hidden border-[3px] border-edge bg-mint shadow-[8px_8px_0_var(--edge)]">
                {sl.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} /> : <div className="grid size-full place-items-center"><Monstera className="sway w-2/3 text-[#2f8452]" /></div>}
              </div>
              <div className="floaty absolute -start-2 top-6 grid size-24 -rotate-12 place-items-center rounded-full border-2 border-edge bg-coral p-2 text-center text-[0.72rem] font-bold leading-tight text-white shadow-[3px_3px_0_var(--edge)] sm:size-28 sm:text-xs" style={{ ["--r" as string]: "-12deg" }}>{t("home.heroCare")}</div>
              <Sparkle className="floaty absolute -end-1 top-4 size-10" />
              <Sparkle className="floaty absolute bottom-10 end-4 size-7" fill="#ff6b4a" />
              <Sprig className="sway absolute -bottom-4 -end-3 w-16 text-[#2f8452] sm:w-20" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
