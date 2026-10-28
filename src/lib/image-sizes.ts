/** Responsive image helpers shared by the file route (server) and the components (client). Pure. */
export const WIDTHS = [320, 480, 640, 800, 1200, 1600] as const;
const LIBRARY_KEY = /^uploads\/[a-z0-9]{20}\.webp$/;

/** Snap a requested width to one of our buckets so the CDN cache doesn't fill with 1-px variants. */
export function snapWidth(w: number): number {
  if (!Number.isFinite(w) || w <= 0) return 0;
  return WIDTHS.find((x) => x >= w) ?? WIDTHS[WIDTHS.length - 1]!;
}

/** Which stored file best serves a width, without any transform: thumb (320) · medium (800) · full (1600). */
export function storedVariantFor(key: string, width: number): string {
  if (!LIBRARY_KEY.test(key) || !width) return key;
  return key.replace(/\.webp$/, width <= 320 ? "-thumb.webp" : width <= 800 ? "-md.webp" : ".webp");
}

/** `src` + `srcSet` for a stored image. Library uploads get several widths (served resized/converted when the Images binding is on, else the nearest stored size); anything else a single URL. */
export function imgProps(key: string | null | undefined, sizes: string, fallback: "md" | "full" | "thumb" = "md"): { src: string; srcSet?: string; sizes?: string } {
  if (!key) return { src: "" };
  if (/^(https?:)?\/\//.test(key) || key.startsWith("/")) return { src: key };
  const base = `/files/${key}`;
  if (!LIBRARY_KEY.test(key)) return { src: base };
  const src = `${base}?w=${fallback === "thumb" ? 320 : fallback === "md" ? 800 : 1600}`;
  return { src, srcSet: WIDTHS.map((w) => `${base}?w=${w} ${w}w`).join(", "), sizes };
}
