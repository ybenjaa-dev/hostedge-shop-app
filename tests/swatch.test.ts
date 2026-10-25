import { describe, expect, it } from "vitest";
import { swatchColor, looksLikeShades } from "@/lib/swatch";

describe("swatch", () => {
  it("maps known shade words and is stable for unknown names", () => {
    expect(swatchColor("Rose")).toBe("#d98a96");
    expect(swatchColor("Deep Berry")).toBe("#8c2f4f");
    expect(swatchColor("Zzz Shade")).toBe(swatchColor("Zzz Shade"));
  });
  it("tells shades from sizes", () => {
    expect(looksLikeShades(["Rose", "Berry"])).toBe(true);
    expect(looksLikeShades(["30 ml", "50 ml"])).toBe(false);
  });
});
