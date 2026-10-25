import { describe, expect, it } from "vitest";
import { fileUrl, variantKey } from "@/lib/storage";

describe("media variants", () => {
  const key = "uploads/abcdefghij0123456789.webp";
  it("derives -md / -thumb siblings for library uploads", () => {
    expect(variantKey(key, "thumb")).toBe("uploads/abcdefghij0123456789-thumb.webp");
    expect(variantKey(key, "md")).toBe("uploads/abcdefghij0123456789-md.webp");
    expect(variantKey(key, "full")).toBe(key);
  });
  it("leaves other keys alone", () => {
    expect(variantKey("uploads/sample-hero.svg", "thumb")).toBe("uploads/sample-hero.svg");
    expect(variantKey("uploads/legacy123.jpg", "md")).toBe("uploads/legacy123.jpg");
    expect(fileUrl("https://x.test/a.png", "thumb")).toBe("https://x.test/a.png");
  });
  it("builds file urls", () => {
    expect(fileUrl(key, "thumb")).toBe("/files/uploads/abcdefghij0123456789-thumb.webp");
    expect(fileUrl(null)).toBe("");
  });
});
