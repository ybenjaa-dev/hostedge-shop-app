"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Trash2, Upload, X, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { uploadImage } from "@/features/admin/components/fields";
import { Panel } from "@/features/admin/components/ui";
import { contrastRatio, isHex, onColor } from "@/lib/color";
import { fileUrl } from "@/lib/storage";
import { ARABIC_FONTS, LATIN_FONTS } from "@/lib/fonts";
import type { I18n, Lang } from "@/lib/i18n-core";
import type { HeroSlide, HomeSection, Settings, TrustBadge } from "@/lib/settings";
import { saveAppearance } from "../actions";
import { StorePreview, PreviewControls, type AppearanceState } from "./preview";

const TABS = [["branding", "Branding"], ["hero", "Hero"], ["home", "Homepage"], ["announcement", "Announcement"], ["footer", "Footer"], ["trust", "Trust badges"]] as const;
type TabId = (typeof TABS)[number][0];
const SECTION_NAME: Record<HomeSection["id"], string> = { hero: "Hero slider", trust: "Trust badges", categories: "Categories", featured: "Featured products", banner: "Promo banner", bestsellers: "Best sellers", reviews: "Customer reviews" };
const ICON_OPTIONS: TrustBadge["icon"][] = ["cod", "returns", "delivery", "secure", "support", "quality"];

function LangInputs({ label, value, onChange, textarea, rows = 2, max }: { label: string; value: I18n; onChange: (v: I18n) => void; textarea?: boolean; rows?: number; max?: number }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="space-y-2">{(["fr", "ar", "en"] as const).map((l) => {
        const props = { value: value[l] ?? "", maxLength: max, dir: l === "ar" ? "rtl" : "ltr", className: "field", "aria-label": `${label} (${l})`, onChange: (e: { target: { value: string } }) => onChange({ ...value, [l]: e.target.value }) } as const;
        return (
          <div key={l} className="flex items-start gap-2"><span className="mt-2.5 w-7 shrink-0 text-center text-[11px] font-extrabold uppercase text-muted">{l}</span>
            {textarea ? <textarea rows={rows} {...props} /> : <input {...props} />}</div>
        );
      })}</div>
    </fieldset>
  );
}

function ImageInput({ label, value, onChange, hint }: { label: string; value: string; onChange: (k: string) => void; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const id = useId();
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-sunken">
          {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(value)} alt="" className="size-full object-contain" /> : <Upload className="size-5 text-muted" aria-hidden />}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={id} className={`btn btn-outline btn-sm cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}{busy ? "Uploading…" : value ? "Replace" : "Upload"}</label>
          <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = "";
              if (!f) return;
              setBusy(true); setErr("");
              const r = await uploadImage(f);
              setBusy(false);
              if (r.ok) onChange(r.key); else setErr(r.error);
            }} />
          {value && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => onChange("")}><X className="size-4" aria-hidden />Remove</button>}
        </div>
      </div>
      {err && <p role="alert" className="err">{err}</p>}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
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

export function AppearanceEditor({ initial, storeName, tagline, currency, defaultLang }: { initial: AppearanceState; storeName: string; tagline: Settings["store"]["tagline"]; currency: string; defaultLang: Lang }) {
  const [v, setV] = useState<AppearanceState>(initial);
  const [tab, setTab] = useState<TabId>("branding");
  const [lang, setLang] = useState<Lang>(defaultLang);
  const [slide, setSlide] = useState(0);
  const [full, setFull] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
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

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t[0] === tab);
    const n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (n < 0) return;
    e.preventDefault();
    const next = TABS[(n + TABS.length) % TABS.length]![0];
    setTab(next);
    requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
  };

  const preview = <StorePreview v={v} storeName={storeName} tagline={tagline} currency={currency} lang={lang} slide={slide} />;
  const panel = (id: TabId, children: ReactNode) => <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={tab !== id} className="space-y-5">{children}</div>;

  return (
    <AdminForm action={saveAppearance} submitLabel="Save appearance" className="space-y-5"
      extra={<>
        <button type="button" className="btn btn-outline" onClick={() => setFull(true)}><Eye className="size-4" aria-hidden />Preview in store</button>
        {dirty && <><span className="text-sm font-semibold text-danger" role="status">Unsaved changes</span><button type="button" className="btn btn-ghost btn-sm" onClick={() => { setV(initialRef.current); setSlide(0); }}><RotateCcw className="size-4" aria-hidden />Discard</button></>}
      </>}>
      <input type="hidden" name="payload" value={JSON.stringify(v)} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div role="tablist" aria-label="Appearance sections" onKeyDown={onTabKey} className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold ${tab === id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}>{label}</button>
            ))}
          </div>

          {panel("branding", <>
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
                  <ImageInput label="Image" value={sl.image} onChange={(k) => patchSlide(i, { image: k })} hint="Wide, 1600×900 recommended." />
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
            <Panel title="Promo banner">
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

        <aside className="xl:sticky xl:top-20" aria-label="Live preview">
          <details className="group xl:open:block" open>
            <summary className="mb-2 flex min-h-10 cursor-pointer list-none items-center justify-between text-sm font-extrabold uppercase tracking-wider text-muted xl:pointer-events-none [&::-webkit-details-marker]:hidden">Live preview <span className="text-xs font-semibold normal-case xl:hidden">tap to toggle</span></summary>
            <div className="space-y-2"><PreviewControls lang={lang} setLang={setLang} slides={slides.length} slide={slide} setSlide={setSlide} />
              <div className="mx-auto max-w-sm xl:max-w-none">{preview}</div></div>
          </details>
        </aside>
      </div>

      {full && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Store preview">
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-2">
            <b className="display">Preview — not saved</b>
            <PreviewControls lang={lang} setLang={setLang} slides={slides.length} slide={slide} setSlide={setSlide} />
            <div className="ms-auto flex items-center gap-2">
              {(["mobile", "desktop"] as const).map((d) => <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`btn btn-sm ${device === d ? "btn-primary" : "btn-outline"}`}>{d === "mobile" ? "Mobile" : "Desktop"}</button>)}
              <button type="button" autoFocus className="btn btn-outline btn-sm" onClick={() => setFull(false)}><X className="size-4" aria-hidden />Close</button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-sunken p-4"><div className={`mx-auto ${device === "mobile" ? "max-w-[390px]" : "max-w-5xl"}`}>{preview}</div></div>
        </div>
      )}
    </AdminForm>
  );
}
