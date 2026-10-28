import { getEnv } from "@/lib/env";
import { newId } from "@/lib/id";

export const MAX_UPLOAD = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Detect the real image type from magic bytes — never trust the client-provided MIME. */
export function sniffImageType(b: Uint8Array): (typeof ALLOWED_TYPES)[number] | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66) return "image/avif";
  return null;
}

export type UploadResult = { ok: true; key: string; url: string; type: string; size: number } | { ok: false; error: string };

export async function saveImage(file: File): Promise<UploadResult> {
  if (file.size > MAX_UPLOAD) return { ok: false, error: "File too large (max 5 MB)." };
  if (file.size === 0) return { ok: false, error: "Empty file." };
  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(buf);
  if (!type) return { ok: false, error: "Unsupported image type. Use JPEG, PNG, WebP or AVIF." };
  const key = `uploads/${newId(20)}.${EXT[type]}`;
  await getEnv().FILES.put(key, buf, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" } });
  return { ok: true, key, url: fileUrl(key), type, size: buf.length };
}

export type ImageSize = "thumb" | "md" | "full";
/** Media-library uploads (`uploads/<20 chars>.webp`) have `-md` (800px) and `-thumb` (320px) siblings; other keys only have one size. */
const LIBRARY_KEY = /^uploads\/[a-z0-9]{20}\.webp$/;
export function variantKey(key: string, size: ImageSize = "full"): string {
  return size !== "full" && LIBRARY_KEY.test(key) ? key.replace(/\.webp$/, `-${size}.webp`) : key;
}

/** Public URL for a stored file key; external URLs pass through. `size` picks the compressed variant for small spots. */
export function fileUrl(key: string | null | undefined, size: ImageSize = "full"): string {
  if (!key) return "";
  if (/^(https?:)?\/\//.test(key) || key.startsWith("/")) return key;
  return `/files/${variantKey(key, size)}`;
}

export async function deleteFile(key: string) {
  if (key.startsWith("uploads/") || key.startsWith("labels/")) await getEnv().FILES.delete(key);
}
