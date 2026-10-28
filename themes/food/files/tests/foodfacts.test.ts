import { describe, expect, it } from "vitest";
import { splitFood } from "@/lib/foodfacts";
import { parseFacts } from "@/lib/facts";

describe("food facts", () => {
  it("splits label rows, diet tags and nutrition (fr)", () => {
    const r = splitFood(parseFacts("Origine: Italie\nPoids net: 500 g\nConservation: 24 mois\nRégime: Vegan, Sans gluten\nÉnergie: 360 kcal\nDont sucres: 3 g\nSel: 0,01 g\nBio: oui"));
    expect(r.origin).toBe("Italie");
    expect(r.weight).toBe("500 g");
    expect(r.shelf).toBe("24 mois");
    expect(r.diet).toEqual(["Vegan", "Sans gluten"]);
    expect(r.nutrition.map((n) => n.label)).toEqual(["Énergie", "Dont sucres", "Sel"]);
    expect(r.rest).toEqual([{ label: "Bio", value: "oui" }]);
  });
  it("reads Arabic labels", () => {
    const r = splitFood(parseFacts("المنشأ: إسبانيا\nالطاقة: 300 kcal"));
    expect(r.origin).toBe("إسبانيا");
    expect(r.nutrition).toHaveLength(1);
  });
});

describe("food facts (diet label in Arabic)", () => {
  it("matches the Arabic 'suitable for' label", () => {
    expect(splitFood(parseFacts("مناسب لـ: نباتي، خالٍ من الغلوتين")).diet).toEqual(["نباتي", "خالٍ من الغلوتين"]);
  });
});
