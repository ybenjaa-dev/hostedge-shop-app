import { describe, expect, it } from "vitest";
import { formatMoney, toMinor, toMajorString, decimalsOf } from "@/lib/money";
import { hashPassword, verifyPassword, encryptJson, decryptJson } from "@/lib/crypto";
import { contrastRatio } from "@/lib/color";

describe("money", () => {
  it("parses to integer minor units without float drift", () => {
    expect(toMinor("19.99", "MAD")).toBe(1999);
    expect(toMinor("0.1", "MAD")).toBe(10);
    expect(toMinor("1.005", "KWD")).toBe(1005);
    expect(toMinor("12,5", "SAR")).toBe(1250);
    expect(toMinor("100", "XOF")).toBe(100);
    expect(Number.isNaN(toMinor("abc", "MAD"))).toBe(true);
  });
  it("round-trips major strings", () => {
    expect(toMajorString(1999, "MAD")).toBe("19.99");
    expect(toMajorString(1005, "KWD")).toBe("1.005");
    expect(toMajorString(5, "MAD")).toBe("0.05");
    expect(decimalsOf("BHD")).toBe(3);
  });
  it("formats 3-decimal and 2-decimal currencies", () => {
    expect(formatMoney(1500, "KWD", "en")).toBe("1.500 KWD");
    expect(formatMoney(12900, "MAD", "fr")).toMatch(/129/);
    expect(formatMoney(12950, "MAD", "en")).toBe("129.50 MAD");
  });
});

describe("crypto", () => {
  it("hashes and verifies passwords", async () => {
    const h = await hashPassword("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
  });
  it("encrypts credentials round-trip", async () => {
    const c = await encryptJson({ apiKey: "abc" }, "k");
    expect(c).not.toContain("abc");
    expect(await decryptJson(c, "k")).toEqual({ apiKey: "abc" });
    await expect(decryptJson(c, "other")).rejects.toThrow();
  });
});

describe("color", () => {
  it("computes WCAG contrast", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });
});
