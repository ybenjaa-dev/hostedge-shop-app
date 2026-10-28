import { describe, expect, it } from "vitest";
import { fitIndex, shoeRows } from "@/lib/shoesize";

describe("shoe sizes", () => {
  it("derives foot length per EU size, sorted and de-duplicated", () => {
    const r = shoeRows(["42", "40", "40", "EU 41", "M"]);
    expect(r.map((x) => x.size)).toEqual(["40", "41", "42"]);
    expect(r.find((x) => x.size === "42")!.cm).toBe("26.5");
  });
  it("skips out-of-range sizes", () => { expect(shoeRows(["8", "25 L", "60"])).toEqual([]); });
  it("reads fit text in three languages", () => {
    expect(fitIndex("Runs small")).toBe(0);
    expect(fitIndex("Taille normalement")).toBe(1);
    expect(fitIndex("يأتي واسعاً")).toBe(2);
    expect(fitIndex("Taille grand")).toBe(2);
    expect(fitIndex(undefined)).toBeNull();
  });
});
