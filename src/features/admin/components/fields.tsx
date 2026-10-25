"use client";
import { useId, useState, type ReactNode } from "react";
import { contrastRatio, onColor, isHex } from "@/lib/color";
import { Upload, X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fileUrl } from "@/lib/storage";

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** One input per language (AR / FR / EN), submitted as name.ar / name.fr / name.en */
export function I18nField({ label, name, value = {}, textarea, rows = 3, hint }: { label: string; name: string; value?: Partial<Record<"ar" | "fr" | "en", string>>; textarea?: boolean; rows?: number; hint?: string }) {
  const id = useId();
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="space-y-2">
        {(["fr", "ar", "en"] as const).map((l) => (
          <div key={l} className="flex items-start gap-2">
            <span className="mt-2.5 w-7 shrink-0 text-center text-[11px] font-extrabold uppercase text-muted">{l}</span>
            {textarea ? (
              <textarea id={`${id}-${l}`} name={`${name}.${l}`} defaultValue={value[l] ?? ""} rows={rows} dir={l === "ar" ? "rtl" : "ltr"} className="field" aria-label={`${label} (${l})`} />
            ) : (
              <input id={`${id}-${l}`} name={`${name}.${l}`} defaultValue={value[l] ?? ""} dir={l === "ar" ? "rtl" : "ltr"} className="field" aria-label={`${label} (${l})`} />
            )}
          </div>
        ))}
      </div>
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

/** Resize + re-encode to WebP in the browser (max 1600px) before upload to cut bytes on slow links. */
async function compress(file: File, max = 1600): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch { return file; }
}

export async function uploadImage(file: File, opts: { compress?: boolean } = {}): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const f = opts.compress === false ? file : await compress(file);
  const form = new FormData();
  form.append("file", f);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  return (await res.json().catch(() => ({ ok: false, error: "Upload failed" }))) as { ok: true; key: string } | { ok: false; error: string };
}

/** Single-image uploader that stores the R2 key in a hidden input. */
export function ImageField({ label, name, value = "", hint, compressImg = true }: { label: string; name: string; value?: string; hint?: string; compressImg?: boolean }) {
  const [key, setKey] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const id = useId();
  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={key} />
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-sunken">
          {key ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(key)} alt="" className="size-full object-contain" /> : <Upload className="size-5 text-muted" />}
        </div>
        <div className="space-y-1.5">
          <label htmlFor={id} className="btn btn-outline btn-sm cursor-pointer">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {key ? "Replace" : "Upload"}</label>
          <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0]; e.target.value = "";
              if (!f) return;
              setBusy(true); setErr("");
              const r = await uploadImage(f, { compress: compressImg });
              setBusy(false);
              if (r.ok) setKey(r.key); else setErr(r.error);
            }} />
          {key && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setKey("")}><X className="size-4" />Remove</button>}
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
