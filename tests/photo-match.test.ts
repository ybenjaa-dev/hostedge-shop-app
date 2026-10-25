import { describe, expect, it } from "vitest";
import { isSampleKey, matchPhoto, type MatchProduct } from "@/lib/photo-match";

const products: MatchProduct[] = [
  { id: "a", slug: "ceramic-pan-set", sku: "HOM-100", names: ["Ceramic non-stick pan set", "Set de poêles céramique"] },
  { id: "b", slug: "discovery-set-5", sku: "ESS-111", names: ["Discovery set — 5 × 10 ml"] },
  { id: "c", slug: "boom-mini-speaker", sku: null, names: ["Enceinte étanche Boom Mini"] },
];

describe("photo matching", () => {
  it("matches slug, sku and names; case, accents and separators don't matter", () => {
    expect(matchPhoto("ceramic-pan-set.jpg", products)).toEqual({ productId: "a", slot: 1 });
    expect(matchPhoto("HOM-100.PNG", products)).toEqual({ productId: "a", slot: 1 });
    expect(matchPhoto("Set de poêles céramique.webp", products)).toEqual({ productId: "a", slot: 1 });
    expect(matchPhoto("enceinte_etanche_boom_mini.jpeg", products)).toEqual({ productId: "c", slot: 1 });
  });
  it("reads a trailing number as the photo slot", () => {
    expect(matchPhoto("ceramic-pan-set-2.jpg", products)).toEqual({ productId: "a", slot: 2 });
    expect(matchPhoto("ceramic_pan_set (3).png", products)).toEqual({ productId: "a", slot: 3 });
  });
  it("prefers an exact name over a trailing number", () => {
    expect(matchPhoto("discovery-set-5.jpg", products)).toEqual({ productId: "b", slot: 1 });
    expect(matchPhoto("discovery-set-5-2.jpg", products)).toEqual({ productId: "b", slot: 2 });
  });
  it("returns null for unknown files", () => {
    expect(matchPhoto("IMG_2041.jpg", products)).toBeNull();
    expect(matchPhoto(".jpg", products)).toBeNull();
  });
  it("detects sample illustrations", () => {
    expect(isSampleKey("uploads/sample-cat-toys.svg")).toBe(true);
    expect(isSampleKey("uploads/abc123.webp")).toBe(false);
    expect(isSampleKey(null)).toBe(false);
  });
});
