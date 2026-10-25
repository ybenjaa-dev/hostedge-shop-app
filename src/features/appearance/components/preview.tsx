"use client";
import { useId } from "react";
import { Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, ShoppingBag, Menu } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { googleFontsUrl } from "@/lib/fonts";
import { isHex, onColor } from "@/lib/color";
import { formatMoney } from "@/lib/money";
import type { Settings, TrustBadge } from "@/lib/settings";

export type AppearanceState = Pick<Settings, "branding" | "hero" | "home" | "announcement" | "footer" | "trust">;
const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };
const SECTION_LABEL: Record<string, string> = { categories: "Shop by category", featured: "Featured", bestsellers: "Best sellers", reviews: "Customer reviews" };
const ok = (c: string, f: string) => (isHex(c) ? c : f);

/** Faithful mini storefront rendered from unsaved form state. Colors are scoped CSS variables on the wrapper (no iframe, nothing persisted). */
export function StorePreview({ v, storeName, tagline, currency, lang, slide = 0 }: { v: AppearanceState; storeName: string; tagline: Settings["store"]["tagline"]; currency: string; lang: Lang; slide?: number }) {
  const b = v.branding;
  const primary = ok(b.primary, "#0f766e"), secondary = ok(b.secondary, "#1f2937"), accent = ok(b.accent, "#f59e0b");
  const radius = b.buttonStyle === "pill" ? "9999px" : b.buttonStyle === "square" ? "0.25rem" : "0.75rem";
  const font = lang === "ar" ? b.fontArabic : b.fontLatin;
  const style = {
    "--brand": primary, "--brand-ink": onColor(primary), "--secondary": secondary, "--accent": accent, "--accent-ink": onColor(accent),
    "--btn-radius": radius, "--brand-soft": `color-mix(in srgb, ${primary} 10%, var(--bg))`,
    "--font-body": `'${b.fontLatin}'`, "--font-body-ar": `'${b.fontArabic}'`, "--font-display": `'${font}'`,
    fontFamily: `'${font}', system-ui, sans-serif`,
  } as React.CSSProperties;
  const logo = fileUrl(b.logo);
  const sl = v.hero.slides[Math.min(slide, Math.max(0, v.hero.slides.length - 1))];
  const sections = v.home.sections.filter((s) => s.visible);
  const card = (n: number) => (
    <div key={n} className="w-36 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="aspect-square bg-sunken" style={{ background: `linear-gradient(135deg, ${primary}33, ${accent}44)` }} />
      <div className="space-y-1.5 p-2.5">
        <p className="truncate text-xs font-bold">{lang === "ar" ? "منتج تجريبي" : "Sample product"}</p>
        <p className="num text-sm font-extrabold" style={{ color: primary }}>{formatMoney(14900, currency, lang)}</p>
        <button type="button" tabIndex={-1} className="btn btn-primary btn-sm w-full !min-h-8 !px-2 !text-xs">{lang === "ar" ? "اطلب الآن" : lang === "fr" ? "Commander" : "Order now"}</button>
      </div>
    </div>
  );
  const rowOf = (key: string) => (
    <section key={key} className="px-3 py-3">
      <p className="display mb-2 text-sm font-extrabold">{SECTION_LABEL[key]}</p>
      {key === "categories" ? (
        <div className="flex gap-2 overflow-hidden">{[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] w-28 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }} />)}</div>
      ) : key === "reviews" ? (
        <div className="rounded-xl border border-line bg-surface p-3 text-xs"><span style={{ color: accent }}>★★★★★</span><p className="mt-1">“{lang === "ar" ? "منتج رائع وتوصيل سريع" : "Great product, fast delivery"}”</p></div>
      ) : <div className="flex gap-2 overflow-hidden">{[0, 1, 2].map(card)}</div>}
    </section>
  );
  return (
    <div style={style} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="overflow-hidden rounded-2xl border border-line bg-bg text-ink" data-preview="store">
      <link rel="stylesheet" href={googleFontsUrl(b.fontLatin, b.fontArabic)} precedence="default" />
      {v.announcement.enabled && tr(v.announcement.text, lang) && <div className="bg-secondary px-3 py-1.5 text-center text-[11px] font-semibold text-white">{tr(v.announcement.text, lang)}</div>}
      <div className="flex h-12 items-center gap-2 border-b border-line bg-bg px-3">
        <Menu className="size-4 text-muted" aria-hidden />
        {logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={storeName} className="brand-logo h-7 w-auto max-w-28 object-contain" /> : <span className="display text-base font-extrabold">{storeName}</span>}
        <span className="ms-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: primary, color: onColor(primary) }}><ShoppingBag className="size-3.5" aria-hidden />0</span>
      </div>
      {sections.map((s) => {
        if (s.id === "hero") {
          return (
            <section key="hero" className="p-3">
              <div className="relative flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl p-4 text-white" style={{ background: sl ? secondary : primary, color: sl ? "#fff" : onColor(primary) }}>
                {sl?.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" />}
                {sl && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />}
                <div className="relative">
                  <h3 className="display text-xl font-extrabold leading-tight">{sl ? tr(sl.title, lang) || (lang === "ar" ? "عنوان الشريحة" : "Slide title") : storeName}</h3>
                  <p className="mt-1 text-xs opacity-90">{sl ? tr(sl.sub, lang) : tr(tagline, lang)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="btn btn-accent btn-sm !min-h-8 !text-xs">{(sl && tr(sl.cta, lang)) || (lang === "ar" ? "تسوّق الآن" : lang === "fr" ? "Acheter" : "Shop now")}</span>
                    {sl?.cta2 && tr(sl.cta2, lang) && <span className="btn btn-sm !min-h-8 border-white/50 bg-white/10 !text-xs text-white">{tr(sl.cta2, lang)}</span>}
                  </div>
                </div>
              </div>
            </section>
          );
        }
        if (s.id === "trust") {
          return (
            <ul key="trust" className="grid gap-2 px-3 py-2">{v.trust.map((t, i) => {
              const Icon = ICONS[t.icon] ?? ShieldCheck;
              return <li key={i} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft" style={{ color: primary }}><Icon className="size-4" aria-hidden /></span><span className="min-w-0"><span className="block truncate text-xs font-bold">{tr(t.title, lang)}</span><span className="block truncate text-[11px] text-muted">{tr(t.text, lang)}</span></span></li>;
            })}</ul>
          );
        }
        if (s.id === "banner") {
          if (!v.home.banner.image) return null;
          return (
            <section key="banner" className="px-3 py-2"><div className="relative overflow-hidden rounded-2xl">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={fileUrl(v.home.banner.image)} alt="" className="aspect-[16/6] min-h-24 w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/60 to-transparent p-4 text-white"><b className="display text-base">{tr(v.home.banner.title, lang)}</b><span className="text-[11px]">{tr(v.home.banner.sub, lang)}</span></div></div></section>
          );
        }
        return rowOf(s.id);
      })}
      <footer className="mt-2 px-4 py-4 text-xs" style={{ background: secondary, color: "#fff" }}>
        <p className="display text-sm font-extrabold">{storeName}</p>
        <p className="mt-1 whitespace-pre-line opacity-80">{tr(v.footer.text, lang)}</p>
      </footer>
    </div>
  );
}

export function PreviewControls({ lang, setLang, slides, slide, setSlide }: { lang: Lang; setLang: (l: Lang) => void; slides: number; slide: number; setSlide: (n: number) => void }) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label htmlFor={`pl-${id}`} className="font-bold text-muted">Language</label>
      <select id={`pl-${id}`} value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="field !min-h-8 !w-auto !py-1 !text-xs"><option value="fr">FR</option><option value="ar">AR</option><option value="en">EN</option></select>
      {slides > 1 && <>
        <span className="font-bold text-muted">Slide</span>
        {Array.from({ length: slides }).map((_, i) => <button key={i} type="button" onClick={() => setSlide(i)} aria-pressed={slide === i} aria-label={`Slide ${i + 1}`} className={`size-8 rounded-full border text-xs font-bold ${slide === i ? "border-brand bg-brand text-brand-ink" : "border-line"}`}>{i + 1}</button>)}
      </>}
    </div>
  );
}
