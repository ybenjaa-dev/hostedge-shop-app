import type { FactRow } from "./facts";

const KEYS = {
  suitable: ["suitable for", "convient à", "convient a", "مناسب لـ", "مناسب ل"],
  stage: ["life stage", "stade de vie", "المرحلة العمرية"],
  size: ["size", "taille", "الحجم", "المقاس"],
  ingredients: ["ingredients", "composition", "المكونات"],
  feeding: ["feeding guide", "guide de rations", "دليل التغذية"],
  care: ["care", "entretien", "العناية"],
} as const;
type K = keyof typeof KEYS;

export type FeedRow = { weight: string; amount: string };

/** Parse a feeding guide like "5 kg = 90 g · 10 kg = 150 g" into rows (any unit text is kept as written). */
export function parseFeeding(value: string | undefined): FeedRow[] {
  if (!value) return [];
  return value
    .split(/\s*[·;،\n]\s*/)
    .map((seg) => {
      const m = seg.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
      return m ? { weight: m[1]!, amount: m[2]! } : null;
    })
    .filter((r): r is FeedRow => !!r);
}

/** Split a pet product's facts into the suited-for tags (comma list), life stage, size, ingredients, feeding table and care; `rest` keeps the other rows. */
export function splitPet(rows: FactRow[]) {
  const out: Partial<Record<Exclude<K, "suitable" | "feeding">, string>> & { suitable: string[]; feeding: FeedRow[]; rest: FactRow[] } = { suitable: [], feeding: [], rest: [] };
  for (const r of rows) {
    if (!r.value) continue;
    const l = r.label.trim().toLowerCase();
    const k = (Object.keys(KEYS) as K[]).find((x) => (KEYS[x] as readonly string[]).includes(l));
    if (k === "suitable") out.suitable = r.value.split(/\s*[,،·]\s*/).filter(Boolean);
    else if (k === "feeding") out.feeding = parseFeeding(r.value);
    else if (k && !out[k]) out[k] = r.value;
    else out.rest.push(r);
  }
  return out;
}
