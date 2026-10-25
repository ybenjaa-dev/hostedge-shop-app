import { describe, expect, it } from "vitest";
import { ringRows } from "@/lib/ringsize";
import { metalGradient } from "@/lib/swatch";

describe("ring sizes", () => {
  it("derives circumference and inner diameter, sorted and de-duplicated", () => {
    const r = ringRows(["54", "52", "52", "EU 56"]);
    expect(r.map((x) => x.size)).toEqual(["52", "54", "56"]);
    expect(r[0]).toEqual({ size: "52", circ: 52, diam: "16.6" });
  });
  it("skips non-sizes", () => { expect(ringRows(["S", "M", "40 cm", "10"])).toEqual([]); });
});

describe("metal gradients", () => {
  it("recognises metals in EN/FR/AR and ignores other colours", () => {
    expect(metalGradient("Gold")).toContain("#d4af37");
    expect(metalGradient("Or rose")).toContain("#d3a193");
    expect(metalGradient("فضي")).toContain("#c3c6cc");
    expect(metalGradient("Navy")).toBeNull();
  });
});
