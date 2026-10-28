import { describe, expect, it } from "vitest";
import { fitList, fitsCar } from "@/lib/fitment";

describe("fitment", () => {
  const text = "Dacia Logan, Dacia Sandero, Renault Clio, Peugeot 208";
  it("matches make + model exactly", () => {
    expect(fitsCar(text, "Dacia", "Logan")).toBe("yes");
    expect(fitsCar(text, "Peugeot", "208")).toBe("yes");
    expect(fitsCar(text, "Renault", "Megane")).toBe("no");
    expect(fitsCar(text, "Toyota", "Yaris")).toBe("no");
  });
  it("does not confuse prefixes of a model", () => {
    expect(fitsCar("Peugeot 2008", "Peugeot", "208")).toBe("no");
  });
  it("handles accents, case and make-only selections", () => {
    expect(fitsCar("citroen c3, Citroën Berlingo", "Citroën", "C3")).toBe("yes");
    expect(fitsCar(text, "Dacia", "")).toBe("yes");
  });
  it("supports 'all models' and universal in three languages", () => {
    expect(fitsCar("Toyota (all models)", "Toyota", "Hilux")).toBe("yes");
    expect(fitsCar("Universel", "Kia", "Rio")).toBe("universal");
    expect(fitsCar("عالمي", "Kia", "Rio")).toBe("universal");
    expect(fitsCar("", "Kia", "Rio")).toBe("unknown");
  });
  it("lists the entries", () => {
    expect(fitList(text)).toHaveLength(4);
    expect(fitList("Universal")).toEqual([]);
  });
});
