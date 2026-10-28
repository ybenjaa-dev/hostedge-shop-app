import { describe, expect, it } from "vitest";
import { longevityHours, splitScent } from "@/lib/scent";
import { parseFacts } from "@/lib/facts";

describe("scent facts", () => {
  it("splits the pyramid in any language", () => {
    const r = splitScent(parseFacts("Famille olfactive: Floral\nNotes de tête: Litchi, Poivre rose\nNotes de cœur: Rose\nNotes de fond: Musc blanc, Patchouli\nTenue: 6–8 h"));
    expect(r.top).toEqual(["Litchi", "Poivre rose"]);
    expect(r.heart).toEqual(["Rose"]);
    expect(r.base).toEqual(["Musc blanc", "Patchouli"]);
    expect(r.longevity).toBe("6–8 h");
    expect(r.rest.map((x) => x.value)).toEqual(["Floral"]);
  });
  it("reads Arabic labels and comma", () => {
    const r = splitScent(parseFacts("النوتات العليا: ورد، ياسمين\nالثبات: 6–8 ساعات"));
    expect(r.top).toEqual(["ورد", "ياسمين"]);
    expect(longevityHours(r.longevity)).toBe(8);
  });
  it("longevity", () => { expect(longevityHours("10 h")).toBe(10); expect(longevityHours("n/a")).toBeNull(); expect(longevityHours(null)).toBeNull(); });
});
