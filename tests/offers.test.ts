import { describe, expect, it } from "vitest";
import { bundleLineTotal, computeTotals, offersFor, type BundleRule } from "@/lib/pricing";

const fixed = (qty: number, price: number, extra: Partial<BundleRule> = {}): BundleRule => ({ productId: "p1", minQty: qty, percent: 0, price, basePrice: 10000, ...extra });
const tiers = [fixed(2, 18000), fixed(3, 24000, { popular: true, label: "Family pack" })];

describe("fixed-price quantity offers", () => {
  it("charges the pack price for exactly the pack size", () => {
    expect(bundleLineTotal("p1", 10000, 1, tiers)).toBe(10000);
    expect(bundleLineTotal("p1", 10000, 2, tiers)).toBe(18000);
    expect(bundleLineTotal("p1", 10000, 3, tiers)).toBe(24000);
  });
  it("combines packs optimally for larger quantities", () => {
    expect(bundleLineTotal("p1", 10000, 4, tiers)).toBe(34000); // 3 + 1 (24000 + 10000) beats 2 + 2 (36000)
    expect(bundleLineTotal("p1", 10000, 5, tiers)).toBe(42000); // 3 + 2
    expect(bundleLineTotal("p1", 10000, 7, tiers)).toBe(58000); // 3 + 3 + 1
  });
  it("scales the pack price for a variant priced differently from the base", () => {
    expect(bundleLineTotal("p1", 20000, 2, tiers)).toBe(36000);
  });
  it("never charges more than the plain price (misconfigured pack)", () => {
    expect(bundleLineTotal("p1", 10000, 2, [fixed(2, 25000)])).toBe(20000);
  });
  it("does not touch other products", () => {
    expect(bundleLineTotal("p2", 10000, 2, tiers)).toBe(20000);
  });
  it("takes the better of a fixed offer and a percentage tier", () => {
    const mixed: BundleRule[] = [fixed(2, 19000), { productId: null, minQty: 2, percent: 10 }];
    expect(bundleLineTotal("p1", 10000, 2, mixed)).toBe(18000);
    expect(bundleLineTotal("p1", 10000, 2, [fixed(2, 17000), { productId: null, minQty: 2, percent: 10 }])).toBe(17000);
  });
  it("feeds computeTotals as a bundle discount", () => {
    const t = computeTotals({ lines: [{ productId: "p1", unitPrice: 10000, qty: 2 }], bundles: tiers, shippingFee: 3000 });
    expect(t.subtotal).toBe(20000);
    expect(t.bundleDiscount).toBe(2000);
    expect(t.total).toBe(18000 + 3000);
    expect(t.lineTotals).toEqual([18000]);
  });
});

describe("offer cards", () => {
  it("lists 1 unit then each tier with the real totals, savings and badges", () => {
    const o = offersFor("p1", 10000, tiers);
    expect(o.map((x) => x.qty)).toEqual([1, 2, 3]);
    expect(o[0]).toMatchObject({ total: 10000, savePct: 0, popular: false });
    expect(o[1]).toMatchObject({ total: 18000, compareAt: 20000, savePct: 10, saved: 2000, perUnit: 9000 });
    expect(o[2]).toMatchObject({ total: 24000, savePct: 20, popular: true, label: "Family pack", best: false });
  });
  it("marks the best value when nothing is flagged popular", () => {
    const o = offersFor("p1", 10000, [fixed(2, 18000), fixed(3, 24000)]);
    expect(o.find((x) => x.best)?.qty).toBe(3);
  });
  it("turns store-wide percentage bundles into cards too", () => {
    const o = offersFor("p9", 5000, [{ productId: null, minQty: 2, percent: 10 }, { productId: null, minQty: 3, percent: 15 }]);
    expect(o.map((x) => [x.qty, x.total])).toEqual([[1, 5000], [2, 9000], [3, 12750]]);
  });
  it("returns only the single unit when there are no offers", () => {
    expect(offersFor("p1", 10000, [])).toHaveLength(1);
  });
});
