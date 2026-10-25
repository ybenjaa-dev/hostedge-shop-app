"use client";
import { useState } from "react";
import { ImagePlus, Images, X } from "lucide-react";
import { fileUrl } from "@/lib/storage";
import { MediaPicker } from "./media-picker";

/** One picture chosen from the media library (or uploaded into it). Shows a thumbnail; `onChange` gets the stored key or "". */
export function MediaImageInput({ label, value, onChange, hint, fit = "contain", size = "size-20", compactLabel }: { label?: string; value: string; onChange: (key: string) => void; hint?: string; fit?: "contain" | "cover"; size?: string; compactLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setOpen(true)} aria-label={`${compactLabel ?? label ?? "Image"}: ${value ? "change" : "choose"}`} title={value ? "Change picture" : "Choose a picture"}
          className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-sunken transition hover:border-ink/40`}>
          {value ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(value, "thumb")} alt="" className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"}`} /> : <ImagePlus className="size-5 text-muted" aria-hidden />}
        </button>
        {!compactLabel && (
          <div className="space-y-1.5">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}><Images className="size-4" aria-hidden />{value ? "Change" : "Choose image"}</button>
            {value && <button type="button" className="btn btn-ghost btn-sm block text-danger" onClick={() => onChange("")}><X className="size-4" aria-hidden />Remove</button>}
          </div>
        )}
        {compactLabel && value && <button type="button" aria-label={`Remove ${compactLabel}`} className="btn btn-ghost btn-sm !px-1.5" onClick={() => onChange("")}><X className="size-4" /></button>}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(items) => { if (items[0]) onChange(items[0].key); }} />
    </div>
  );
}
