"use client";
import { useId, useState, type ReactNode } from "react";
import { contrastRatio, onColor, isHex } from "@/lib/color";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Lang } from "@/lib/i18n-core";
import { ADMIN_LANGS, LangTabs } from "./lang-tabs";
import { uploadMedia } from "@/lib/media-client";
import { MediaImageInput } from "@/features/media/image-input";

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** One input per language (FR / AR / EN) behind a language tab bar, submitted as name.ar / name.fr / name.en. All three stay in the form, only one is shown. */
export function I18nField({ label, name, value = {}, textarea, rows = 3, hint }: { label: string; name: string; value?: Partial<Record<"ar" | "fr" | "en", string>>; textarea?: boolean; rows?: number; hint?: string }) {
  const id = useId();
  const [active, setActive] = useState<Lang>(() => ADMIN_LANGS.find((l) => value[l.id]?.trim())?.id ?? "fr");
  const [vals, setVals] = useState<Partial<Record<Lang, string>>>(value);
  const filled = Object.fromEntries(ADMIN_LANGS.map((l) => [l.id, !!vals[l.id]?.trim()])) as Record<Lang, boolean>;
  return (
    <fieldset>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><legend className="label !mb-0">{label}</legend><LangTabs active={active} onChange={setActive} filled={filled} idPrefix={id} /></div>
      {ADMIN_LANGS.map((l) => (
        <div key={l.id} role="tabpanel" id={`${id}-panel-${l.id}`} aria-labelledby={`${id}-tab-${l.id}`} hidden={active !== l.id}>
          {textarea ? (
            <textarea id={`${id}-${l.id}`} name={`${name}.${l.id}`} defaultValue={value[l.id] ?? ""} rows={rows} dir={l.id === "ar" ? "rtl" : "ltr"} className="field" aria-label={`${label} (${l.label})`} onChange={(e) => setVals((v) => ({ ...v, [l.id]: e.target.value }))} />
          ) : (
            <input id={`${id}-${l.id}`} name={`${name}.${l.id}`} defaultValue={value[l.id] ?? ""} dir={l.id === "ar" ? "rtl" : "ltr"} className="field" aria-label={`${label} (${l.label})`} onChange={(e) => setVals((v) => ({ ...v, [l.id]: e.target.value }))} />
          )}
        </div>
      ))}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}

export function Toggle({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3.5 transition hover:border-ink/30">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="peer sr-only" />
      <span aria-hidden className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
      <span><span className="block font-semibold">{label}</span>{hint && <span className="text-sm text-muted">{hint}</span>}</span>
    </label>
  );
}

/** Color picker + hex field + WCAG contrast check against the text color used on top of it. */
export function ColorField({ label, name, value, against = "#ffffff", hint }: { label: string; name: string; value: string; against?: string; hint?: string }) {
  const [v, setV] = useState(value);
  const ok = isHex(v);
  const ratio = ok ? contrastRatio(v, against) : 0;
  const text = ok ? onColor(v) : "#000";
  const best = ok ? contrastRatio(v, text) : 0;
  return (
    <div>
      <label className="label" htmlFor={`${name}-hex`}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} picker`} value={ok ? v : "#000000"} onChange={(e) => setV(e.target.value)} className="size-11 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-1" />
        <input id={`${name}-hex`} name={name} value={v} onChange={(e) => setV(e.target.value)} pattern="#[0-9a-fA-F]{6}" className="field num uppercase" maxLength={7} />
      </div>
      {ok && (
        <p className={`mt-1.5 flex items-center gap-1.5 text-xs font-semibold ${best >= 4.5 ? "text-ok" : "text-danger"}`}>
          {best >= 4.5 ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
          Text on this color: <span className="num">{best.toFixed(1)}:1</span> {best >= 4.5 ? "(AA pass)" : "(low contrast)"}
          {against !== "#ffffff" || ratio ? null : null}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Upload through the media library (compressed WebP + thumbnails, duplicates reuse the stored file). */
export async function uploadImage(file: File, opts: { compress?: boolean } = {}): Promise<{ ok: true; key: string; duplicate?: boolean } | { ok: false; error: string }> {
  const r = await uploadMedia(file, opts);
  return r.ok ? { ok: true, key: r.key, duplicate: r.duplicate } : r;
}

/** Single-image field: choose from the media library (or upload into it); stores the R2 key in a hidden input. */
export function ImageField({ label, name, value = "", hint }: { label: string; name: string; value?: string; hint?: string; compressImg?: boolean }) {
  const [key, setKey] = useState(value);
  return (
    <div>
      <input type="hidden" name={name} value={key} />
      <MediaImageInput label={label} value={key} onChange={setKey} hint={hint} />
    </div>
  );
}
