import { describe, expect, it } from "vitest";
import { splitKids } from "@/lib/kidsfacts";
import { parseFacts } from "@/lib/facts";

describe("kids facts", () => {
  it("extracts age, material, safety list and leaves the rest", () => {
    const r = splitKids(parseFacts("Âge: 6–12 mois\nMatière: Silicone alimentaire\nSécurité: Sans BPA, Normes EN71\nTaille: 20 cm\nPièces: 4"));
    expect(r.age).toBe("6–12 mois");
    expect(r.material).toBe("Silicone alimentaire");
    expect(r.safety).toEqual(["Sans BPA", "Normes EN71"]);
    expect(r.size).toBe("20 cm");
    expect(r.rest).toEqual([{ label: "Pièces", value: "4" }]);
  });
  it("reads Arabic labels", () => {
    const r = splitKids(parseFacts("العمر: 1–3 سنوات\nالسلامة: بدون BPA، EN71"));
    expect(r.age).toBe("1–3 سنوات");
    expect(r.safety).toEqual(["بدون BPA", "EN71"]);
  });
});
