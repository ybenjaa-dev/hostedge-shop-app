import { describe, expect, it } from "vitest";
import { computeTotals, bestBundlePercent, freeShippingRemaining } from "@/lib/pricing";

const line = (price: number, qty: number, id = "p1") => ({ productId: id, unitPrice: price, qty });

describe("computeTotals", () => {
  it("sums subtotal + shipping + cod fee", () => {
    const t = computeTotals({ lines: [line(10000, 2)], shippingFee: 3000, codFee: 1500 });
    expect(t.subtotal).toBe(20000);
    expect(t.total).toBe(24500);
  });
  it("applies free shipping at the threshold (inclusive)", () => {
    const t = computeTotals({ lines: [line(25000, 2)], shippingFee: 3000, freeShippingThreshold: 50000 });
    expect(t.shipping).toBe(0);
    expect(t.freeShippingApplied).toBe(true);
    expect(computeTotals({ lines: [line(49999, 1)], shippingFee: 3000, freeShippingThreshold: 50000 }).shipping).toBe(3000);
  });
  it("uses the best bundle for quantity and floors the discount in integers", () => {
    const bundles = [
      { productId: null, minQty: 2, percent: 10 },
      { productId: "p1", minQty: 3, percent: 15 },
    ];
    expect(bestBundlePercent("p1", 2, bundles)).toBe(10);
    expect(bestBundlePercent("p1", 3, bundles)).toBe(15);
    expect(bestBundlePercent("p2", 3, bundles)).toBe(10);
    const t = computeTotals({ lines: [line(3333, 3)], bundles, shippingFee: 0 });
    expect(t.bundleDiscount).toBe(Math.floor((9999 * 15) / 100)); // 1499
    expect(t.total).toBe(9999 - 1499);
  });
  it("handles percent, fixed and free-shipping coupons", () => {
    const base = { lines: [line(10000, 1)], shippingFee: 2000 };
    expect(computeTotals({ ...base, coupon: { code: "A", type: "percent", value: 20, minSubtotal: 0 } }).total).toBe(8000 + 2000);
    expect(computeTotals({ ...base, coupon: { code: "B", type: "fixed", value: 99999, minSubtotal: 0 } }).total).toBe(2000); // capped
    expect(computeTotals({ ...base, coupon: { code: "C", type: "free_shipping", value: 0, minSubtotal: 0 } }).shipping).toBe(0);
  });
  it("rejects coupon below minimum subtotal", () => {
    const t = computeTotals({ lines: [line(1000, 1)], shippingFee: 0, coupon: { code: "X", type: "percent", value: 50, minSubtotal: 5000 } });
    expect(t.couponError).toBe("min_subtotal");
    expect(t.couponDiscount).toBe(0);
  });
  it("supports inclusive and exclusive tax", () => {
    const ex = computeTotals({ lines: [line(10000, 1)], shippingFee: 0, taxRateBp: 2000 });
    expect(ex.tax).toBe(2000);
    expect(ex.total).toBe(12000);
    const inc = computeTotals({ lines: [line(12000, 1)], shippingFee: 0, taxRateBp: 2000, taxInclusive: true });
    expect(inc.tax).toBe(2000);
    expect(inc.total).toBe(12000);
  });
  it("keeps 3-decimal currency math exact", () => {
    const t = computeTotals({ lines: [line(1250, 3)], shippingFee: 500, codFee: 250 }); // KWD minor = fils
    expect(t.total).toBe(3750 + 500 + 250);
  });
  it("computes free-shipping remaining", () => {
    expect(freeShippingRemaining(30000, 50000)).toBe(20000);
    expect(freeShippingRemaining(60000, 50000)).toBe(0);
    expect(freeShippingRemaining(1, 0)).toBe(0);
  });
});
