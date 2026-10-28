import type { FactRow } from "./facts";

const KEYS = {
  age: ["age", "âge", "العمر"],
  material: ["material", "matière", "matiere", "الخامة"],
  size: ["size", "dimensions", "taille", "المقاس", "الأبعاد"],
  care: ["care", "entretien", "العناية"],
  safety: ["safety", "sécurité", "securite", "السلامة"],
} as const;
type K = keyof typeof KEYS;

/** Split a children's product facts into age, material, size, care, safety checklist (comma list) and the remaining rows. */
export function splitKids(rows: FactRow[]) {
  const out: Partial<Record<Exclude<K, "safety">, string>> & { safety: string[]; rest: FactRow[] } = { safety: [], rest: [] };
  for (const r of rows) {
    const l = r.label.trim().toLowerCase();
    if (!r.value) continue;
    const k = (Object.keys(KEYS) as K[]).find((x) => (KEYS[x] as readonly string[]).includes(l));
    if (k === "safety") out.safety = r.value.split(/\s*[,،·]\s*/).filter(Boolean);
    else if (k && !out[k]) out[k] = r.value;
    else out.rest.push(r);
  }
  return out;
}
