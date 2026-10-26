"use client";
import { useEffect, useId, useRef, type ElementType, type ReactNode } from "react";
import { useDirOf } from "@/components/lang-context";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Banknote, RotateCcw, Truck, ShieldCheck, Headset, Gem, ShoppingBag, Menu } from "lucide-react";
import { tr, type I18n, type Lang } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { googleFontsUrl } from "@/lib/fonts";
import { isHex, onColor } from "@/lib/color";
import { formatMoney } from "@/lib/money";
import type { Settings, TrustBadge, HeroSlide } from "@/lib/settings";

/** Click-to-edit wiring from the Appearance studio. Without it the preview is read-only. */
export type PreviewEdit = { selected: string; select: (id: string) => void; change: (next: AppearanceState) => void };

/** A region of the mini storefront. In edit mode it highlights on hover, selects on click and can carry a small toolbar. */
function Region({ id, label, edit, children, bar, className = "" }: { id: string; label: string; edit?: PreviewEdit; children: ReactNode; bar?: ReactNode; className?: string }) {
  if (!edit) return <div className={className}>{children}</div>;
  const on = edit.selected === id;
  return (
    <div data-region={id} className={`group/r relative cursor-pointer rounded-xl outline-2 -outline-offset-2 transition ${on ? "outline outline-[var(--brand)]" : "outline-transparent hover:outline hover:outline-[color-mix(in_srgb,var(--brand)_55%,transparent)]"} ${className}`}
      onClick={(e) => { e.stopPropagation(); edit.select(id); }}>
      <span className={`pointer-events-none absolute start-1.5 top-1.5 z-20 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow ${on ? "bg-[var(--brand)] text-[var(--brand-ink)]" : "bg-black/70 text-white opacity-0 group-hover/r:opacity-100"}`}>{label}</span>
      {on && bar && <span className="absolute end-1.5 top-1.5 z-20 flex gap-0.5 rounded-lg bg-black/75 p-0.5 text-white shadow" onClick={(e) => e.stopPropagation()}>{bar}</span>}
      {children}
    </div>
  );
}
const BarBtn = ({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) => (
  <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="grid size-6 place-items-center rounded-md hover:bg-white/20 disabled:opacity-30">{children}</button>
);

/** Text you can type into directly inside the preview (commits on blur / Enter). Plain read-only text when `edit` is off. */
function Inline({ value, onCommit, edit, as: Tag = "span", multiline, className = "", placeholder }: { value: string; onCommit: (t: string) => void; edit?: PreviewEdit; as?: ElementType; multiline?: boolean; className?: string; placeholder?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => { if (edit && ref.current && document.activeElement !== ref.current && ref.current.textContent !== value) ref.current.textContent = value; }, [value, edit]);
  if (!edit) return <Tag className={className}>{value}</Tag>;
  return <Tag ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-label={placeholder} data-placeholder={placeholder} className={`${className} inline-edit`}
    onClick={(e: React.MouseEvent) => e.stopPropagation()}
    onBlur={(e: React.FocusEvent<HTMLElement>) => { const t = (e.currentTarget.textContent ?? "").replace(/\u00a0/g, " ").trim(); if (t !== value) onCommit(t); }}
    onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { if (e.key === "Enter" && !multiline) { e.preventDefault(); e.currentTarget.blur(); } }}>{value}</Tag>;
}

export type AppearanceState = Pick<Settings, "branding" | "hero" | "home" | "announcement" | "footer" | "trust">;
const ICONS: Record<TrustBadge["icon"], typeof Banknote> = { cod: Banknote, returns: RotateCcw, delivery: Truck, secure: ShieldCheck, support: Headset, quality: Gem };
const SECTION_LABEL: Record<string, string> = { categories: "Shop by category", featured: "Featured", bestsellers: "Best sellers", reviews: "Customer reviews" };
const ok = (c: string, f: string) => (isHex(c) ? c : f);

/** Faithful mini storefront rendered from unsaved form state. Colors are scoped CSS variables on the wrapper (no iframe, nothing persisted). */
export function StorePreview({ v, storeName, tagline, currency, lang, slide = 0, edit }: { v: AppearanceState; storeName: string; tagline: Settings["store"]["tagline"]; currency: string; lang: Lang; slide?: number ; edit?: PreviewEdit}) {
  const b = v.branding;
  const primary = ok(b.primary, "#0f766e"), secondary = ok(b.secondary, "#1f2937"), accent = ok(b.accent, "#f59e0b");
  const radius = b.buttonStyle === "pill" ? "9999px" : b.buttonStyle === "square" ? "0.25rem" : "0.75rem";
  const dir = useDirOf(lang);
  const font = dir === "rtl" ? b.fontArabic : b.fontLatin;
  const style = {
    "--brand": primary, "--brand-ink": onColor(primary), "--secondary": secondary, "--accent": accent, "--accent-ink": onColor(accent),
    "--btn-radius": radius, "--brand-soft": `color-mix(in srgb, ${primary} 10%, var(--bg))`,
    "--font-body": `'${b.fontLatin}'`, "--font-body-ar": `'${b.fontArabic}'`, "--font-display": `'${font}'`,
    fontFamily: `'${font}', system-ui, sans-serif`,
  } as React.CSSProperties;
  const logo = fileUrl(b.logo);
  const sl = v.hero.slides[Math.min(slide, Math.max(0, v.hero.slides.length - 1))];
  const sections = edit ? v.home.sections : v.home.sections.filter((s) => s.visible);
  const si = Math.min(slide, Math.max(0, v.hero.slides.length - 1));
  const setL = (o: I18n, t: string): I18n => ({ ...o, [lang]: t });
  const patchSlide = (p: Partial<HeroSlide>) => edit?.change({ ...v, hero: { slides: v.hero.slides.map((x, k) => (k === si ? { ...x, ...p } : x)) } });
  const patchTrust = (i: number, p: Partial<TrustBadge>) => edit?.change({ ...v, trust: v.trust.map((x, k) => (k === i ? { ...x, ...p } : x)) });
  const moveSection = (id: string, d: -1 | 1) => { const a = [...v.home.sections]; const i = a.findIndex((x) => x.id === id), j = i + d; if (i < 0 || j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j]!, a[i]!]; edit?.change({ ...v, home: { ...v.home, sections: a } }); };
  const toggleSection = (id: string) => edit?.change({ ...v, home: { ...v.home, sections: v.home.sections.map((x) => (x.id === id ? { ...x, visible: !x.visible } : x)) } });
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
    <div style={style} dir={dir} lang={lang} className={`overflow-hidden rounded-2xl border border-line bg-bg text-ink ${BRAND.themeClass}`} data-preview="store">
      <link rel="stylesheet" href={googleFontsUrl(b.fontLatin, b.fontArabic)} precedence="default" />
      {((v.announcement.enabled && tr(v.announcement.text, lang)) || edit) && (
        <Region id="announcement" label="Announcement" edit={edit} className="!rounded-none">
          <div className={`bg-secondary px-3 py-1.5 text-center text-[11px] font-semibold text-white ${v.announcement.enabled ? "" : "opacity-40"}`}>
            <Inline edit={edit} value={tr(v.announcement.text, lang)} placeholder="Announcement text" onCommit={(t) => edit?.change({ ...v, announcement: { ...v.announcement, text: setL(v.announcement.text, t) } })} />
          </div>
        </Region>
      )}
      <Region id="branding" label="Logo & colors" edit={edit} className="!rounded-none">
      <div className="flex h-12 items-center gap-2 border-b border-line bg-bg px-3">
        <Menu className="size-4 text-muted" aria-hidden />
        {logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={storeName} className="brand-logo h-7 w-auto max-w-28 object-contain" /> : <span className="display text-base font-extrabold">{storeName}</span>}
        <span className="ms-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold" style={{ background: primary, color: onColor(primary) }}><ShoppingBag className="size-3.5" aria-hidden />0</span>
      </div>
      </Region>
      {sections.map((s) => {
        const el = (() => {
        if (s.id === "hero") {
          return (
            <section key="hero" className="p-3">
              <div className="relative flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl p-4 text-white" style={{ background: sl ? secondary : primary, color: sl ? "#fff" : onColor(primary) }}>
                {sl?.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(sl.image)} alt="" className="absolute inset-0 size-full object-cover" />}
                {sl && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />}
                <div className="relative">
                  {sl ? <Inline as="h3" edit={edit} className="display block text-xl font-extrabold leading-tight" value={tr(sl.title, lang)} placeholder={lang === "ar" ? "عنوان الشريحة" : "Slide title"} onCommit={(t) => patchSlide({ title: setL(sl.title, t) })} /> : <h3 className="display text-xl font-extrabold leading-tight">{storeName}</h3>}
                  {sl ? <Inline as="p" edit={edit} className="mt-1 block text-xs opacity-90" value={tr(sl.sub, lang)} placeholder="Subtitle" onCommit={(t) => patchSlide({ sub: setL(sl.sub, t) })} /> : <p className="mt-1 text-xs opacity-90">{tr(tagline, lang)}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="btn btn-accent btn-sm !min-h-8 !text-xs">{sl && edit ? <Inline edit={edit} value={tr(sl.cta, lang)} placeholder="Button" onCommit={(t) => patchSlide({ cta: setL(sl.cta, t) })} /> : (sl && tr(sl.cta, lang)) || (lang === "ar" ? "تسوّق الآن" : lang === "fr" ? "Acheter" : "Shop now")}</span>
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
              return <li key={i} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft" style={{ color: primary }}><Icon className="size-4" aria-hidden /></span><span className="min-w-0"><Inline as="span" edit={edit} className="block truncate text-xs font-bold" value={tr(t.title, lang)} placeholder="Title" onCommit={(x) => patchTrust(i, { title: setL(t.title, x) })} /><Inline as="span" edit={edit} className="block truncate text-[11px] text-muted" value={tr(t.text, lang)} placeholder="Text" onCommit={(x) => patchTrust(i, { text: setL(t.text, x) })} /></span></li>;
            })}</ul>
          );
        }
        if (s.id === "banner") {
          if (!v.home.banner.image) return null;
          return (
            <section key="banner" className="px-3 py-2"><div className="relative overflow-hidden rounded-2xl">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={fileUrl(v.home.banner.image)} alt="" className="aspect-[16/6] min-h-24 w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/60 to-transparent p-4 text-white"><Inline as="b" edit={edit} className="display block text-base" value={tr(v.home.banner.title, lang)} placeholder="Banner title" onCommit={(t) => edit?.change({ ...v, home: { ...v.home, banner: { ...v.home.banner, title: setL(v.home.banner.title, t) } } })} /><Inline edit={edit} className="block text-[11px]" value={tr(v.home.banner.sub, lang)} placeholder="Banner subtitle" onCommit={(t) => edit?.change({ ...v, home: { ...v.home, banner: { ...v.home.banner, sub: setL(v.home.banner.sub, t) } } })} /></div></div></section>
          );
        }
        return rowOf(s.id);
        })();
        if (!el) return null;
        const idx = v.home.sections.findIndex((x) => x.id === s.id);
        return (
          <Region key={s.id} id={s.id} label={s.id === "hero" ? "Hero" : s.id === "trust" ? "Trust badges" : s.id === "banner" ? "Promo banner" : SECTION_LABEL[s.id] ?? s.id} edit={edit} className={s.visible ? "" : "opacity-40"}
            bar={<><BarBtn label="Move up" disabled={idx <= 0} onClick={() => moveSection(s.id, -1)}><ArrowUp className="size-3.5" /></BarBtn><BarBtn label="Move down" disabled={idx >= v.home.sections.length - 1} onClick={() => moveSection(s.id, 1)}><ArrowDown className="size-3.5" /></BarBtn><BarBtn label={s.visible ? "Hide section" : "Show section"} onClick={() => toggleSection(s.id)}>{s.visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</BarBtn></>}>
            {el}
          </Region>
        );
      })}
      <Region id="footer" label="Footer" edit={edit} className="!rounded-none mt-2">
      <footer className="mt-2 px-4 py-4 text-xs" style={{ background: secondary, color: "#fff" }}>
        <p className="display text-sm font-extrabold">{storeName}</p>
        <Inline as="p" multiline edit={edit} className="mt-1 block whitespace-pre-line opacity-80" value={tr(v.footer.text, lang)} placeholder="Footer text" onCommit={(t) => edit?.change({ ...v, footer: { text: setL(v.footer.text, t) } })} />
      </footer>
      </Region>
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
