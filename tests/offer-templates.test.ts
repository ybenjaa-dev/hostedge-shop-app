import { describe, expect, it } from "vitest";
import { isOfferTemplate, OFFER_TEMPLATES, resolveOfferTemplate } from "@/lib/offer-templates";

describe("offer templates", () => {
  it("offers five layouts", () => { expect(OFFER_TEMPLATES.map((t) => t.id)).toEqual(["list", "tiles", "photo", "pills", "highlight"]); });
  it("validates ids", () => { expect(isOfferTemplate("tiles")).toBe(true); expect(isOfferTemplate("grid")).toBe(false); expect(isOfferTemplate(null)).toBe(false); });
  it("product choice beats the store default, which beats the list", () => {
    expect(resolveOfferTemplate("pills", "tiles")).toBe("pills");
    expect(resolveOfferTemplate(null, "tiles")).toBe("tiles");
    expect(resolveOfferTemplate("", "bogus")).toBe("list");
    expect(resolveOfferTemplate(undefined, undefined)).toBe("list");
  });
});
