import type { FactRow } from "./facts";

const KEYS = {
  dimensions: ["dimensions", "size", "الأبعاد"],
  material: ["material", "materials", "matière", "matiere", "الخامة"],
  weight: ["weight", "poids", "الوزن"],
  capacity: ["capacity", "capacité", "capacite", "السعة"],
  care: ["care", "entretien", "العناية"],
} as const;
export type HomeKey = keyof typeof KEYS;

/** Pull the well-known home facts (dimensions, material, weight, capacity, care) out of a product's facts rows; `rest` keeps every other row. */
export function splitHome(rows: FactRow[]) {
  const out: Partial<Record<HomeKey, string>> & { rest: FactRow[] } = { rest: [] };
  for (const r of rows) {
    const l = r.label.trim().toLowerCase();
    const k = (Object.keys(KEYS) as HomeKey[]).find((x) => (KEYS[x] as readonly string[]).includes(l));
    if (k && r.value && !out[k]) out[k] = r.value;
    else if (r.value) out.rest.push(r);
  }
  return out;
}
