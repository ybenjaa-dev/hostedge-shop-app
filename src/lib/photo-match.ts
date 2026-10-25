/** Match dropped photo files to products by file name — pure, so the bulk uploader is easy to test. */
export type MatchProduct = { id: string; slug: string; sku?: string | null; names: string[] };
export type PhotoMatch = { productId: string; slot: number } | null;

const clean = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

/**
 * "ceramic-pan-set.jpg" → that product, photo 1 · "ceramic-pan-set-2.jpg" / "ceramic_pan_set (3).png" → photo 2 / 3.
 * A name that already matches exactly wins over a trailing number, so a product whose slug ends in "-5" still matches itself.
 * Matches the product slug, SKU, or any of its names (any language).
 */
export function matchPhoto(filename: string, products: MatchProduct[]): PhotoMatch {
  const stem = clean(filename.replace(/\.[a-z0-9]+$/i, ""));
  if (!stem) return null;
  const keys = (p: MatchProduct) => new Set([clean(p.slug), p.sku ? clean(p.sku) : "", ...p.names.map(clean)].filter(Boolean));
  const hit = products.find((p) => keys(p).has(stem));
  if (hit) return { productId: hit.id, slot: 1 };
  const m = stem.match(/^(.*?)-(\d{1,2})$/);
  if (m) {
    const base = m[1]!;
    const slot = parseInt(m[2]!, 10);
    const p = products.find((x) => keys(x).has(base));
    if (p && slot >= 1) return { productId: p.id, slot };
  }
  return null;
}

/** True for the placeholder illustrations that ship with the sample data. */
export const isSampleKey = (key: string | null | undefined) => !!key && key.startsWith("uploads/sample-");
