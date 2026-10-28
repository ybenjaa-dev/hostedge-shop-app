/** Plant care facts for the sample catalogue, keyed by product slug. Products not listed here simply show no care chips. */
export type Care = { kind: "plant" | "pot" | "tool" | "seed"; light?: 1 | 2 | 3; water?: 1 | 2 | 3; diff?: 1 | 2 | 3; pet?: boolean };

const CARE: Record<string, Care> = {
  "monstera-deliciosa": { kind: "plant", light: 2, water: 2, diff: 1, pet: false },
  "snake-plant": { kind: "plant", light: 1, water: 1, diff: 1, pet: false },
  "golden-pothos": { kind: "plant", light: 1, water: 2, diff: 1, pet: false },
  "echeveria-rosette": { kind: "plant", light: 3, water: 1, diff: 2, pet: true },
  "cactus-trio": { kind: "plant", light: 3, water: 1, diff: 1, pet: true },
  "aloe-vera": { kind: "plant", light: 3, water: 1, diff: 1, pet: false },
  "terracotta-pot-set": { kind: "pot" },
  "hanging-planter": { kind: "pot" },
  "watering-can": { kind: "tool" },
  "garden-tool-set": { kind: "tool" },
  "herb-seed-kit": { kind: "seed", light: 3, water: 2, diff: 1, pet: true },
  "wildflower-seeds": { kind: "seed", light: 3, water: 2, diff: 1, pet: true },
};

export const careOf = (slug: string): Care | undefined => CARE[slug];
