"use client";
import type { MediaItem } from "@/features/media/server";

export type { MediaItem };
export type UploadOutcome = { ok: true; key: string; media: MediaItem; duplicate: boolean } | { ok: false; error: string };

const SIZES = { full: { max: 1600, q: 0.82 }, md: { max: 800, q: 0.8 }, thumb: { max: 320, q: 0.75 } } as const;

async function sha256Hex(file: Blob): Promise<string | null> {
  try {
    const d = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

async function toWebp(bmp: ImageBitmap, max: number, q: number): Promise<{ blob: Blob; w: number; h: number } | null> {
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale)), h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", q));
  return blob && blob.type === "image/webp" ? { blob, w, h } : null;
}

/**
 * Compress in the browser and upload to the media library: a full-size WebP (max 1600px), a medium one (800px) and a thumbnail (320px).
 * A picture that is already in the library (same bytes) is never uploaded twice — the existing entry is returned with `duplicate: true`.
 */
export async function uploadMedia(file: File, opts: { compress?: boolean } = {}): Promise<UploadOutcome> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return { ok: false, error: "Use a JPEG, PNG, WebP or AVIF image." };
  const sourceHash = await sha256Hex(file);
  try {
    if (sourceHash) {
      const r = await fetch(`/api/admin/media?hash=${sourceHash}`);
      const j = (await r.json().catch(() => null)) as { media?: MediaItem | null } | null;
      if (j?.media) return { ok: true, key: j.media.key, media: j.media, duplicate: true };
    }
  } catch { /* offline check failed — just upload */ }

  const form = new FormData();
  form.set("name", file.name.replace(/\.\w+$/, ""));
  if (sourceHash) form.set("sourceHash", sourceHash);
  let sent = false;
  if (opts.compress !== false) {
    try {
      const bmp = await createImageBitmap(file);
      const full = await toWebp(bmp, SIZES.full.max, SIZES.full.q);
      if (full) {
        // a small WebP that is already lighter than our re-encode is kept as it is
        const keepSource = file.type === "image/webp" && file.size <= full.blob.size && Math.max(bmp.width, bmp.height) <= SIZES.full.max;
        form.set("file", keepSource ? file : new File([full.blob], "full.webp", { type: "image/webp" }));
        form.set("width", String(full.w)); form.set("height", String(full.h));
        const md = await toWebp(bmp, SIZES.md.max, SIZES.md.q), th = await toWebp(bmp, SIZES.thumb.max, SIZES.thumb.q);
        if (md) form.set("md", new File([md.blob], "md.webp", { type: "image/webp" }));
        if (th) form.set("thumb", new File([th.blob], "thumb.webp", { type: "image/webp" }));
        sent = true;
      }
      bmp.close();
    } catch { /* e.g. AVIF unsupported by the canvas — send the original */ }
  }
  if (!sent) form.set("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: form });
  const j = (await res.json().catch(() => null)) as { ok: boolean; error?: string; media?: MediaItem; duplicate?: boolean } | null;
  if (!j?.ok || !j.media) return { ok: false, error: j?.error ?? "Upload failed" };
  return { ok: true, key: j.media.key, media: j.media, duplicate: !!j.duplicate };
}

export function formatBytes(n: number): string {
  if (!n) return "—";
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;
}
