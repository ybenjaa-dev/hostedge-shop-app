import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/phone";

describe("normalizePhone", () => {
  it("normalizes Moroccan formats", () => {
    for (const v of ["0612345678", "612345678", "+212612345678", "00212 6 12 34 56 78", "+212 (0)612345678".replace("(0)", "0"), "212612345678"]) {
      const r = normalizePhone(v, "MA");
      expect(r).toMatchObject({ ok: true, e164: "212612345678", country: "MA" });
    }
  });
  it("accepts Arabic-Indic digits", () => {
    expect(normalizePhone("٠٦١٢٣٤٥٦٧٨", "MA")).toMatchObject({ ok: true, e164: "212612345678" });
  });
  it("validates GCC numbers", () => {
    expect(normalizePhone("0551234567", "SA")).toMatchObject({ ok: true, e164: "966551234567" });
    expect(normalizePhone("0501234567", "AE")).toMatchObject({ ok: true, e164: "971501234567" });
    expect(normalizePhone("51234567", "KW")).toMatchObject({ ok: true, e164: "96551234567" });
    expect(normalizePhone("+97433123456", "MA")).toMatchObject({ ok: true, country: "QA" });
  });
  it("rejects bad numbers", () => {
    expect(normalizePhone("123", "MA")).toEqual({ ok: false, reason: "invalid" });
    expect(normalizePhone("", "MA")).toEqual({ ok: false, reason: "empty" });
    expect(normalizePhone("0112345678", "MA")).toMatchObject({ ok: false });
  });
});
