import { describe, expect, it } from "vitest";
import { imgProps, snapWidth, storedVariantFor } from "@/lib/image-sizes";

const key = "uploads/abcdefghij0123456789.webp";
describe("image sizes", () => {
  it("snaps widths to buckets", () => { expect(snapWidth(300)).toBe(320); expect(snapWidth(321)).toBe(480); expect(snapWidth(5000)).toBe(1600); expect(snapWidth(0)).toBe(0); expect(snapWidth(NaN)).toBe(0); });
  it("serves the nearest stored size without a transform", () => {
    expect(storedVariantFor(key, 320)).toContain("-thumb.webp");
    expect(storedVariantFor(key, 640)).toContain("-md.webp");
    expect(storedVariantFor(key, 1200)).toBe(key);
    expect(storedVariantFor("uploads/sample-hero.svg", 320)).toBe("uploads/sample-hero.svg");
  });
  it("builds srcset only for library images", () => {
    const p = imgProps(key, "50vw");
    expect(p.srcSet).toContain("/files/" + key + "?w=480 480w");
    expect(p.sizes).toBe("50vw");
    expect(imgProps("uploads/legacy.jpg", "50vw").srcSet).toBeUndefined();
    expect(imgProps("https://x.test/a.png", "50vw").src).toBe("https://x.test/a.png");
    expect(imgProps(null, "50vw").src).toBe("");
  });
});
