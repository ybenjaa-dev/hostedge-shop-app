import { describe, expect, it } from "vitest";
import { parseFeeding, splitPet } from "@/lib/petfacts";
import { parseFacts } from "@/lib/facts";

describe("pet facts", () => {
  it("parses a feeding guide", () => {
    expect(parseFeeding("5 kg = 90 g · 10 kg = 150 g · 20 kg = 250 g")).toEqual([
      { weight: "5 kg", amount: "90 g" }, { weight: "10 kg", amount: "150 g" }, { weight: "20 kg", amount: "250 g" },
    ]);
    expect(parseFeeding("nothing here")).toEqual([]);
    expect(parseFeeding(undefined)).toEqual([]);
  });
  it("splits the known rows in French", () => {
    const r = splitPet(parseFacts("Convient à: Chien, Adulte\nStade de vie: Adulte\nTaille: Moyennes races\nComposition: Poulet 28 %, riz\nGuide de rations: 5 kg = 90 g · 10 kg = 150 g\nPoids: 12 kg"));
    expect(r.suitable).toEqual(["Chien", "Adulte"]);
    expect(r.stage).toBe("Adulte");
    expect(r.size).toBe("Moyennes races");
    expect(r.ingredients).toBe("Poulet 28 %, riz");
    expect(r.feeding).toHaveLength(2);
    expect(r.rest).toEqual([{ label: "Poids", value: "12 kg" }]);
  });
  it("reads Arabic labels", () => {
    const r = splitPet(parseFacts("مناسب لـ: كلب، بالغ\nالمكونات: دجاج وأرز"));
    expect(r.suitable).toEqual(["كلب", "بالغ"]);
    expect(r.ingredients).toBe("دجاج وأرز");
  });
});
