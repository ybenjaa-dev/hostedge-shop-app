import { describe, expect, it } from "vitest";
import { DEFAULT_EXTRA, extraCss, parseExtra } from "@/lib/appearance-extra";

describe("look & feel options", () => {
  it("emits nothing for the theme defaults", () => expect(extraCss(DEFAULT_EXTRA)).toBe(""));
  it("falls back to defaults for junk input", () => {
    expect(parseExtra("not json")).toEqual(DEFAULT_EXTRA);
    expect(parseExtra({ roundness: "hexagon", bgCustom: "red" })).toEqual(DEFAULT_EXTRA);
  });
  it("builds CSS for the chosen options, scoped when asked", () => {
    const e = { ...DEFAULT_EXTRA, roundness: "round" as const, width: "wide" as const, background: "custom" as const, bgCustom: "#fafafa", headingCase: "upper" as const, buttonCase: "upper" as const };
    const css = extraCss(e);
    expect(css).toContain("--radius-2xl:1.75rem");
    expect(css).toContain("--container-7xl:92rem");
    expect(css).toContain("--bg:#fafafa");
    expect(css).toContain(".display{text-transform:uppercase");
    expect(extraCss(e, '[data-preview="store"]')).toContain('[data-preview="store"] .btn{text-transform:uppercase');
  });
});
