import { describe, expect, it } from "vitest";
import { splitHome } from "@/lib/homefacts";
import { parseFacts } from "@/lib/facts";

describe("home facts", () => {
  it("extracts the known rows in any language and keeps the rest", () => {
    const r = splitHome(parseFacts("Dimensions: 40 × 28 cm\nMatière: Bambou\nPoids: 900 g\nEntretien: Lavage à la main\nPièces: 1"));
    expect(r.dimensions).toBe("40 × 28 cm");
    expect(r.material).toBe("Bambou");
    expect(r.weight).toBe("900 g");
    expect(r.care).toBe("Lavage à la main");
    expect(r.rest).toEqual([{ label: "Pièces", value: "1" }]);
  });
  it("reads Arabic labels", () => {
    const r = splitHome(parseFacts("الأبعاد: 30 × 20 سم\nالخامة: خشب"));
    expect(r.dimensions).toBe("30 × 20 سم");
    expect(r.material).toBe("خشب");
  });
});
