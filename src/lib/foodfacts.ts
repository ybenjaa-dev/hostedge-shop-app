import type { FactRow } from "./facts";

const KEYS = {
  origin: ["origin", "origine", "المنشأ"],
  weight: ["net weight", "weight", "poids net", "poids", "الوزن الصافي", "الوزن"],
  shelf: ["shelf life", "durée de conservation", "conservation", "مدة الصلاحية"],
  ingredients: ["ingredients", "ingrédients", "المكونات"],
  allergens: ["allergens", "allergènes", "مسببات الحساسية"],
  storage: ["storage", "stockage", "التخزين"],
  diet: ["diet", "suitable for", "régime", "convient aux régimes", "النظام الغذائي", "مناسب لـ"],
} as const;
const NUTRITION = ["energy", "énergie", "الطاقة", "fat", "matières grasses", "الدهون", "of which saturates", "dont saturés", "منها مشبعة", "carbohydrates", "glucides", "الكربوهيدرات", "of which sugars", "dont sucres", "منها سكريات", "fibre", "fibres", "الألياف", "protein", "protéines", "البروتين", "salt", "sel", "الملح"];
type K = keyof typeof KEYS;

/** Split a food product's facts into well-known rows, diet tags and the nutrition table (values are per 100 g); `rest` keeps every other row. */
export function splitFood(rows: FactRow[]) {
  const out: Partial<Record<Exclude<K, "diet">, string>> & { diet: string[]; nutrition: FactRow[]; rest: FactRow[] } = { diet: [], nutrition: [], rest: [] };
  for (const r of rows) {
    const l = r.label.trim().toLowerCase();
    if (!r.value) continue;
    const k = (Object.keys(KEYS) as K[]).find((x) => (KEYS[x] as readonly string[]).includes(l));
    if (k === "diet") out.diet = r.value.split(/\s*[,،·]\s*/).filter(Boolean);
    else if (k) { if (!out[k]) out[k] = r.value; else out.rest.push(r); }
    else if (NUTRITION.includes(l)) out.nutrition.push(r);
    else out.rest.push(r);
  }
  return out;
}
