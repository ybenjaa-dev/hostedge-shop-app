/** Makes and models offered by the "fits my car" finder. Edit freely — the finder only builds a search and a compatibility check from these names. */
export const CARS: Record<string, string[]> = {
  Dacia: ["Logan", "Sandero", "Duster"],
  Renault: ["Clio", "Megane", "Kangoo"],
  Peugeot: ["208", "301", "Partner"],
  Citroën: ["C3", "C-Elysée", "Berlingo"],
  Toyota: ["Yaris", "Corolla", "Hilux"],
  Hyundai: ["i10", "Accent", "Tucson"],
  Volkswagen: ["Polo", "Golf", "Caddy"],
  Fiat: ["Panda", "Tipo", "500"],
  Ford: ["Fiesta", "Focus", "Transit"],
  Kia: ["Picanto", "Rio", "Sportage"],
};

export type Fit = "yes" | "no" | "universal" | "unknown";

const UNIVERSAL = /universal|universel|عالمي|toutes? (?:les )?voitures|any car/i;
const ALL_MODELS = /all models|tous (?:les )?modèles|جميع الطرازات|كل الطرازات/i;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Does a product whose compatibility text is `text` fit this make/model? "unknown" when there is no compatibility info at all. */
export function fitsCar(text: string | null | undefined, make: string, model: string): Fit {
  if (!text || !text.trim()) return "unknown";
  if (UNIVERSAL.test(text)) return "universal";
  const m = norm(make);
  const mo = norm(model);
  if (!m) return "unknown";
  for (const entry of text.split(/[;,،·\n]/)) {
    const e = norm(entry);
    if (!e.includes(m)) continue;
    if (!mo || ALL_MODELS.test(entry) || (" " + e + " ").includes(" " + mo + " ")) return "yes";
  }
  return "no";
}

/** The models in a compatibility text (entries split on , ; ·), for display and counting. Returns [] for universal products. */
export function fitList(text: string | null | undefined): string[] {
  if (!text || UNIVERSAL.test(text)) return [];
  return text.split(/[;,،·\n]/).map((x) => x.trim()).filter(Boolean);
}
