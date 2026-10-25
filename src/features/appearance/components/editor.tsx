"use client";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Monitor, MousePointerClick, Plus, Smartphone, Tablet, Trash2, X, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { MediaImageInput } from "@/features/media/image-input";
import { Panel } from "@/features/admin/components/ui";
import { contrastRatio, isHex, onColor } from "@/lib/color";
import { ARABIC_FONTS, LATIN_FONTS } from "@/lib/fonts";
import type { I18n, Lang } from "@/lib/i18n-core";
import type { HeroSlide, HomeSection, Settings, TrustBadge } from "@/lib/settings";
import { saveAppearance } from "../actions";
import { FONT_PAIRS, PALETTES } from "../presets";
import { StorePreview, type AppearanceState } from "./preview";
import { SubmitButton } from "@/components/ui/submit";
import { ADMIN_LANGS, LangTabs } from "@/features/admin/components/lang-tabs";

const TABS = [["branding", "Branding"], ["hero", "Hero"], ["home", "Homepage"], ["announcement", "Announcement"], ["footer", "Footer"], ["trust", "Trust badges"]] as const;
type TabId = (typeof TABS)[number][0];
const SECTION_NAME: Record<HomeSection["id"], string> = { hero: "Hero slider", trust: "Trust badges", categories: "Categories", featured: "Featured products", banner: "Promo banner", bestsellers: "Best sellers", reviews: "Customer reviews" };
const ICON_OPTIONS: TrustBadge["icon"][] = ["cod", "returns", "delivery", "secure", "support", "quality"];

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "fr", setLang: () => {} });

/** One translated text field: a language tab bar (shared with the live preview) and the field for the chosen language. */
function LangInputs({ label, value, onChange, textarea, rows = 2, max }: { label: string; value: I18n; onChange: (v: I18n) => void; textarea?: boolean; rows?: number; max?: number }) {
  const { lang, setLang } = useContext(LangCtx);
  const id = useId();
  const filled = Object.fromEntries(ADMIN_LANGS.map((l) => [l.id, !!value[l.id]?.trim()])) as Record<Lang, boolean>;
  const props = { value: value[lang] ?? "", maxLength: max, dir: lang === "ar" ? "rtl" : "ltr", lang, className: "field", "aria-label": `${label} (${lang})`, onChange: (e: { target: { value: string } }) => onChange({ ...value, [lang]: e.target.value }) };
  return (
    <fieldset>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><legend className="label !mb-0">{label}</legend><LangTabs active={lang} onChange={setLang} filled={filled} idPrefix={id} /></div>
      {textarea ? <textarea rows={rows} {...props} /> : <input {...props} />}
    </fieldset>
  );
}

function ImageInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (k: string) => void; hint?: string }) {
  return <MediaImageInput label={label} value={value} onChange={onChange} hint={hint} />;
}

function ColorInput({ label, value, onChange, against, hint }: { label: string; value: string; onChange: (v: string) => void; against: "text-on" | "white-on"; hint?: string }) {
  const valid = isHex(value);
  const id = useId();
  const ratio = !valid ? 0 : against === "text-on" ? contrastRatio(value, onColor(value)) : contrastRatio(value, "#ffffff");
  const pass = ratio >= 4.5;
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} picker`} value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="size-11 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-1" />
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!valid} maxLength={7} dir="ltr" className="field num uppercase" />
      </div>
      {!valid ? <p className="err">Use a hex color like #0F766E</p> : (
        <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${pass ? "text-ok" : "text-danger"}`}>
          {pass ? <CheckCircle2 className="size-3.5" aria-hidden /> : <AlertTriangle className="size-3.5" aria-hidden />}
          {against === "text-on" ? "Button text contrast" : "White text contrast"}: <span className="num">{ratio.toFixed(1)}:1</span> {pass ? "(AA pass)" : "(low — hard to read)"}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const IconBtn = ({ label, onClick, disabled, children, danger }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode; danger?: boolean }) => (
  <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`btn btn-ghost btn-sm !min-h-10 !w-10 !p-0 ${danger ? "text-danger" : ""}`}>{children}</button>
);
function move<T>(arr: T[], i: number, d: -1 | 1): T[] {
  const j = i + d; if (j < 0 || j >= arr.length) return arr;
  const c = [...arr]; [c[i], c[j]] = [c[j]!, c[i]!]; return c;
}

export function AppearanceEditor({ initial, original, storeName, tagline, currency, defaultLang }: { initial: AppearanceState; original: AppearanceState["branding"]; storeName: string; tagline: Settings["store"]["tagline"]; currency: string; defaultLang: Lang }) {
  const [v, setV] = useState<AppearanceState>(initial);
  const [tab, setTab] = useState<TabId>("branding");
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [slide, setSlide] = useState(0);
  const [full, setFull] = useState(false);
  const [device, setDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [region, setRegion] = useState("");
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  const initialRef = useRef(initial);
  // After a successful save the server re-sends `initial`; keep our edits and just track the new baseline.
  useEffect(() => { initialRef.current = initial; }, [initial]);
  const set = <K extends keyof AppearanceState>(k: K, val: AppearanceState[K]) => setV((x) => ({ ...x, [k]: val }));
  const setBrand = (p: Partial<AppearanceState["branding"]>) => set("branding", { ...v.branding, ...p });
  const slides = v.hero.slides;
  const setSlides = (s: HeroSlide[]) => set("hero", { slides: s });
  const patchSlide = (i: number, p: Partial<HeroSlide>) => setSlides(slides.map((x, k) => (k === i ? { ...x, ...p } : x)));

  useEffect(() => {
    if (!full) return;
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [full]);

  const REGION_TAB: Record<string, TabId> = { branding: "branding", hero: "hero", trust: "trust", footer: "footer", announcement: "announcement", banner: "home", categories: "home", featured: "home", bestsellers: "home", reviews: "home" };
  const pick = (id: string) => { setRegion(id); const t = REGION_TAB[id]; if (t) setTab(t); if (id === "banner") requestAnimationFrame(() => document.getElementById("banner-panel")?.scrollIntoView({ block: "start", behavior: "smooth" })); };
  const preview = <StorePreview v={v} storeName={storeName} tagline={tagline} currency={currency} lang={lang} slide={slide} />;
  const canvas = <StorePreview v={v} storeName={storeName} tagline={tagline} currency={currency} lang={lang} slide={slide} edit={{ selected: region, select: pick, change: setV }} />;
  const panel = (id: TabId, children: ReactNode) => <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={tab !== id} className="space-y-5">{children}</div>;
  const frame = device === "mobile" ? "max-w-[390px]" : device === "tablet" ? "max-w-[768px]" : "max-w-[1100px]";

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
    <AdminForm action={saveAppearance} hideSubmit className="space-y-4">
      <input type="hidden" name="payload" value={JSON.stringify(v)} />
      {/* studio bar */}
      <div className="card sticky top-16 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 p-3">
        <div className="flex items-center gap-2">
          <LangTabs active={lang} onChange={setLang} filled={{ fr: true, ar: true, en: true }} idPrefix="studio" />
        </div>
        <div className="inline-flex gap-0.5 rounded-xl border border-line bg-sunken p-0.5" role="group" aria-label="Preview device">
          {([["mobile", Smartphone, "Phone"], ["tablet", Tablet, "Tablet"], ["desktop", Monitor, "Desktop"]] as const).map(([d, I, l]) => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} title={l} aria-label={l} className={`grid size-8 place-items-center rounded-[0.65rem] transition ${device === d ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}><I className="size-4" aria-hidden /></button>
          ))}
        </div>
        {slides.length > 1 && <div className="flex items-center gap-1 text-xs"><span className="font-bold text-muted">Slide</span>{slides.map((_, i) => <button key={i} type="button" onClick={() => { setSlide(i); pick("hero"); }} aria-pressed={slide === i} aria-label={`Slide ${i + 1}`} className={`size-7 rounded-full border text-xs font-bold ${slide === i ? "border-brand bg-brand text-brand-ink" : "border-line"}`}>{i + 1}</button>)}</div>}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {dirty && <><span className="text-sm font-semibold text-danger" role="status">Unsaved changes</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setV(initialRef.current); setSlide(0); }}><RotateCcw className="size-4" aria-hidden />Discard</button></>}
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setFull(true)}><Eye className="size-4" aria-hidden />Full preview</button>
          <SubmitButton pendingText="Saving…">Save appearance</SubmitButton>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-36 lg:max-h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:pe-1">
          <div role="tablist" aria-label="Appearance sections" className="tabnav w-full flex-wrap !overflow-visible">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => { setTab(id); setRegion(id === "home" ? "" : id); }}>{label}</button>
            ))}
          </div>

          {panel("branding", <>
            <Panel title="Quick styles" actions={<button type="button" className="btn btn-ghost btn-sm" onClick={() => setBrand({ primary: original.primary, secondary: original.secondary, accent: original.accent, buttonStyle: original.buttonStyle, fontLatin: original.fontLatin, fontArabic: original.fontArabic })}><RotateCcw className="size-4" aria-hidden />Original look</button>}>
              <p className="mb-3 text-sm text-muted">Pick a palette or font pairing, then fine-tune below. The preview updates instantly — nothing is saved until you press Save.</p>
              <p className="label">Colour palettes</p>
              <ul className="mb-4 flex flex-wrap gap-2">{PALETTES.map((p) => {
                const on = v.branding.primary.toLowerCase() === p.primary && v.branding.secondary.toLowerCase() === p.secondary && v.branding.accent.toLowerCase() === p.accent;
                return (<li key={p.name}><button type="button" aria-pressed={on} onClick={() => setBrand({ primary: p.primary, secondary: p.secondary, accent: p.accent, ...(p.buttonStyle ? { buttonStyle: p.buttonStyle } : {}) })} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${on ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-ink/40"}`}>
                  <span className="flex -space-x-1.5 rtl:space-x-reverse" aria-hidden>{[p.primary, p.secondary, p.accent].map((c) => <span key={c} className="size-4 rounded-full border border-white/70" style={{ background: c }} />)}</span>{p.name}</button></li>);
              })}</ul>
              <p className="label">Font pairings</p>
              <ul className="flex flex-wrap gap-2">{FONT_PAIRS.map((f) => {
                const on = v.branding.fontLatin === f.latin && v.branding.fontArabic === f.arabic;
                return (<li key={f.name}><button type="button" aria-pressed={on} onClick={() => setBrand({ fontLatin: f.latin, fontArabic: f.arabic })} className={`rounded-full border px-3 py-1.5 text-sm font-bold ${on ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-ink/40"}`}>{f.name}<span className="ms-1.5 font-normal text-muted">{f.latin}</span></button></li>);
              })}</ul>
            </Panel>
            <Panel title="Logo & icon">
              <div className="grid gap-5 sm:grid-cols-2">
                <ImageInput label="Logo" value={v.branding.logo} onChange={(k) => setBrand({ logo: k })} hint="Shown in the header. Transparent PNG/WebP works best." />
                <ImageInput label="Favicon" value={v.branding.favicon} onChange={(k) => setBrand({ favicon: k })} hint="Square image, at least 64×64." />
              </div>
            </Panel>
            <Panel title="Colors">
              <div className="grid gap-5 sm:grid-cols-3">
                <ColorInput label="Primary" value={v.branding.primary} onChange={(c) => setBrand({ primary: c })} against="text-on" hint="Buttons, links, highlights." />
                <ColorInput label="Secondary" value={v.branding.secondary} onChange={(c) => setBrand({ secondary: c })} against="white-on" hint="Announcement bar & footer (white text)." />
                <ColorInput label="Accent" value={v.branding.accent} onChange={(c) => setBrand({ accent: c })} against="text-on" hint="Call-to-action buttons." />
              </div>
            </Panel>
            <Panel title="Buttons & fonts">
              <fieldset><legend className="label">Button style</legend>
                <div className="flex flex-wrap gap-2">{(["rounded", "pill", "square"] as const).map((s) => (
                  <label key={s} className={`flex min-h-11 cursor-pointer items-center gap-2 border px-4 text-sm font-bold capitalize focus-within:outline focus-within:outline-2 focus-within:outline-brand ${v.branding.buttonStyle === s ? "border-brand bg-brand-soft" : "border-line"} ${s === "pill" ? "rounded-full" : s === "square" ? "rounded" : "rounded-xl"}`}>
                    <input type="radio" name="buttonStyle-ui" className="sr-only" checked={v.branding.buttonStyle === s} onChange={() => setBrand({ buttonStyle: s })} />{s}</label>
                ))}</div></fieldset>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label className="label" htmlFor="font-latin">Latin font</label><select id="font-latin" className="field" value={v.branding.fontLatin} onChange={(e) => setBrand({ fontLatin: e.target.value })}>{LATIN_FONTS.map((f) => <option key={f}>{f}</option>)}</select></div>
                <div><label className="label" htmlFor="font-ar">Arabic font</label><select id="font-ar" className="field" value={v.branding.fontArabic} onChange={(e) => setBrand({ fontArabic: e.target.value })}>{ARABIC_FONTS.map((f) => <option key={f}>{f}</option>)}</select></div>
              </div>
            </Panel>
          </>)}

          {panel("hero", <>
            <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">{slides.length ? `${slides.length} slide${slides.length > 1 ? "s" : ""}` : "No slides — the storefront shows a simple brand banner."}</p>
              <button type="button" className="btn btn-outline btn-sm" disabled={slides.length >= 10} onClick={() => { setSlides([...slides, { image: "", title: {}, sub: {}, cta: {}, href: "/shop" }]); setSlide(slides.length); }}><Plus className="size-4" aria-hidden />Add slide</button></div>
            {slides.map((sl, i) => (
              <Panel key={i} title={`Slide ${i + 1}`} actions={<div className="flex items-center">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => { setSlides(move(slides, i, -1)); setSlide(i - 1); }}><ArrowUp className="size-4" /></IconBtn>
                <IconBtn label="Move down" disabled={i === slides.length - 1} onClick={() => { setSlides(move(slides, i, 1)); setSlide(i + 1); }}><ArrowDown className="size-4" /></IconBtn>
                <IconBtn label="Remove slide" danger onClick={() => { setSlides(slides.filter((_, k) => k !== i)); setSlide(0); }}><Trash2 className="size-4" /></IconBtn></div>}>
                <div className="space-y-4" onFocusCapture={() => setSlide(i)}>
                  <ImageInput label="Image" value={sl.image} onChange={(k) => patchSlide(i, { image: k })} hint="Wide, 1600×900 recommended — keep the subject near the centre, text sits on top. Most layouts crop to the container." />
                  <LangInputs label="Title" value={sl.title} onChange={(t) => patchSlide(i, { title: t })} max={160} />
                  <LangInputs label="Subtitle" value={sl.sub} onChange={(t) => patchSlide(i, { sub: t })} max={300} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3"><LangInputs label="Button text" value={sl.cta} onChange={(t) => patchSlide(i, { cta: t })} max={60} />
                      <div><label className="label" htmlFor={`href-${i}`}>Button link</label><input id={`href-${i}`} className="field" dir="ltr" value={sl.href} onChange={(e) => patchSlide(i, { href: e.target.value })} placeholder="/shop" /></div></div>
                    <div className="space-y-3"><LangInputs label="Second button (optional)" value={sl.cta2 ?? {}} onChange={(t) => patchSlide(i, { cta2: t })} max={60} />
                      <div><label className="label" htmlFor={`href2-${i}`}>Second button link</label><input id={`href2-${i}`} className="field" dir="ltr" value={sl.href2 ?? ""} onChange={(e) => patchSlide(i, { href2: e.target.value })} placeholder="/category/…" /></div></div>
                  </div>
                </div>
              </Panel>
            ))}
          </>)}

          {panel("home", <>
            <Panel title="Section order">
              <p className="mb-3 text-sm text-muted">Reorder and show or hide the sections of the homepage.</p>
              <ol className="space-y-2">{v.home.sections.map((s, i) => (
                <li key={s.id} className={`flex items-center gap-2 rounded-xl border border-line bg-surface p-2 ${s.visible ? "" : "opacity-60"}`}>
                  <span className="num grid size-7 place-items-center rounded-full bg-sunken text-xs font-bold">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{SECTION_NAME[s.id]}</span>
                  <IconBtn label={`${s.visible ? "Hide" : "Show"} ${SECTION_NAME[s.id]}`} onClick={() => set("home", { ...v.home, sections: v.home.sections.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)) })}>{s.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</IconBtn>
                  <IconBtn label={`Move ${SECTION_NAME[s.id]} up`} disabled={i === 0} onClick={() => set("home", { ...v.home, sections: move(v.home.sections, i, -1) })}><ArrowUp className="size-4" /></IconBtn>
                  <IconBtn label={`Move ${SECTION_NAME[s.id]} down`} disabled={i === v.home.sections.length - 1} onClick={() => set("home", { ...v.home, sections: move(v.home.sections, i, 1) })}><ArrowDown className="size-4" /></IconBtn>
                </li>
              ))}</ol>
            </Panel>
            <Panel title="Promo banner" id="banner-panel">
              <div className="space-y-4">
                <ImageInput label="Banner image" value={v.home.banner.image} onChange={(k) => set("home", { ...v.home, banner: { ...v.home.banner, image: k } })} hint="Wide image (16:6). The banner section must be visible and have an image to appear." />
                <LangInputs label="Title" value={v.home.banner.title} onChange={(t) => set("home", { ...v.home, banner: { ...v.home.banner, title: t } })} max={160} />
                <LangInputs label="Subtitle" value={v.home.banner.sub} onChange={(t) => set("home", { ...v.home, banner: { ...v.home.banner, sub: t } })} max={300} />
                <div><label className="label" htmlFor="banner-href">Link</label><input id="banner-href" className="field" dir="ltr" value={v.home.banner.href} onChange={(e) => set("home", { ...v.home, banner: { ...v.home.banner, href: e.target.value } })} placeholder="/shop" /></div>
              </div>
            </Panel>
          </>)}

          {panel("announcement", <Panel title="Announcement bar">
            <label className="mb-4 flex min-h-11 cursor-pointer items-center gap-3 font-semibold"><input type="checkbox" className="size-5 accent-[var(--brand)]" checked={v.announcement.enabled} onChange={(e) => set("announcement", { ...v.announcement, enabled: e.target.checked })} />Show the announcement bar</label>
            <div className="space-y-4"><LangInputs label="Text" value={v.announcement.text} onChange={(t) => set("announcement", { ...v.announcement, text: t })} max={200} />
              <div><label className="label" htmlFor="ann-href">Link (optional)</label><input id="ann-href" className="field" dir="ltr" value={v.announcement.href} onChange={(e) => set("announcement", { ...v.announcement, href: e.target.value })} placeholder="/shop" /></div></div>
          </Panel>)}

          {panel("footer", <Panel title="Footer text"><LangInputs label="Text under the store name" value={v.footer.text} onChange={(t) => set("footer", { text: t })} textarea rows={3} max={1000} /></Panel>)}

          {panel("trust", <>
            <div className="flex items-center justify-between gap-3"><p className="text-sm text-muted">Short reassurance points shown on the homepage.</p>
              <button type="button" className="btn btn-outline btn-sm" disabled={v.trust.length >= 8} onClick={() => set("trust", [...v.trust, { icon: "quality", title: {}, text: {} }])}><Plus className="size-4" aria-hidden />Add badge</button></div>
            {v.trust.map((b, i) => (
              <Panel key={i} title={`Badge ${i + 1}`} actions={<div className="flex items-center">
                <IconBtn label="Move up" disabled={i === 0} onClick={() => set("trust", move(v.trust, i, -1))}><ArrowUp className="size-4" /></IconBtn>
                <IconBtn label="Move down" disabled={i === v.trust.length - 1} onClick={() => set("trust", move(v.trust, i, 1))}><ArrowDown className="size-4" /></IconBtn>
                <IconBtn label="Remove badge" danger onClick={() => set("trust", v.trust.filter((_, k) => k !== i))}><Trash2 className="size-4" /></IconBtn></div>}>
                <div className="space-y-4">
                  <div className="max-w-xs"><label className="label" htmlFor={`ti-${i}`}>Icon</label><select id={`ti-${i}`} className="field" value={b.icon} onChange={(e) => set("trust", v.trust.map((x, k) => (k === i ? { ...x, icon: e.target.value as TrustBadge["icon"] } : x)))}>{ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                  <LangInputs label="Title" value={b.title} max={60} onChange={(t) => set("trust", v.trust.map((x, k) => (k === i ? { ...x, title: t } : x)))} />
                  <LangInputs label="Text" value={b.text} max={160} onChange={(t) => set("trust", v.trust.map((x, k) => (k === i ? { ...x, text: t } : x)))} />
                </div>
              </Panel>
            ))}
          </>)}
        </div>

        <section aria-label="Live preview" className="min-w-0 lg:sticky lg:top-36">
          <div className="overflow-hidden rounded-2xl border border-line bg-sunken">
            <p className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2 text-xs text-muted"><MousePointerClick className="size-4 shrink-0" aria-hidden /><span>Click any part of the preview to edit it — and type straight onto texts. Nothing is public until you save.</span></p>
            <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto p-3 sm:p-5" onClick={() => setRegion("")}><div className={`mx-auto transition-[max-width] duration-300 ${frame}`}>{canvas}</div></div>
          </div>
        </section>
      </div>

      {full && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Store preview">
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2">
            <b className="display">Preview — not saved</b>
            <LangTabs active={lang} onChange={setLang} filled={{ fr: true, ar: true, en: true }} idPrefix="full" />
            <div className="ms-auto flex items-center gap-2">
              {(["mobile", "tablet", "desktop"] as const).map((d) => <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`btn btn-sm ${device === d ? "btn-primary" : "btn-outline"}`}>{d === "mobile" ? "Phone" : d === "tablet" ? "Tablet" : "Desktop"}</button>)}
              <button type="button" autoFocus className="btn btn-outline btn-sm" onClick={() => setFull(false)}><X className="size-4" aria-hidden />Close</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-sunken p-4"><div className={`mx-auto ${frame}`}>{preview}</div></div>
        </div>
      )}
    </AdminForm>
    </LangCtx.Provider>
  );
}
