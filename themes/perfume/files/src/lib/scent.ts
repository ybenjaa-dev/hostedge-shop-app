import type { FactRow } from "./facts";

const TIERS = {
  top: ["top notes", "notes de tête", "notes de tete", "النوتات العليا"],
  heart: ["heart notes", "notes de cœur", "notes de coeur", "نوتات القلب"],
  base: ["base notes", "notes de fond", "نوتات القاعدة"],
} as const;
const LONGEVITY = ["longevity", "tenue", "longévité", "الثبات"];

const norm = (s: string) => s.trim().toLowerCase();

/** Split a product's facts into the olfactive pyramid (top / heart / base notes), the longevity row and everything else. */
export function splitScent(rows: FactRow[]) {
  const out = { top: [] as string[], heart: [] as string[], base: [] as string[], longevity: null as string | null, rest: [] as FactRow[] };
  for (const r of rows) {
    const l = norm(r.label);
    const tier = (Object.keys(TIERS) as (keyof typeof TIERS)[]).find((k) => (TIERS[k] as readonly string[]).includes(l));
    if (tier) out[tier] = r.value.split(/\s*[,،·]\s*/).filter(Boolean);
    else if (LONGEVITY.includes(l)) out.longevity = r.value;
    else if (r.value) out.rest.push(r);
  }
  return out;
}

/** Upper bound in hours of a longevity string such as "6–8 h" (null if there is no number). */
export function longevityHours(v: string | null): number | null {
  if (!v) return null;
  const m = v.match(/(\d+(?:[.,]\d+)?)\D*$/);
  return m ? parseFloat(m[1]!.replace(",", ".")) : null;
}
