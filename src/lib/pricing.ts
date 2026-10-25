/** Pure pricing engine. All amounts are integer minor units — no floating point money. */

export type PriceLine = { productId: string; unitPrice: number; qty: number };
export type BundleRule = { productId: string | null; minQty: number; percent: number };
export type CouponRule = {
  code: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal: number;
};

export type TotalsInput = {
  lines: PriceLine[];
  bundles?: BundleRule[];
  coupon?: CouponRule | null;
  shippingFee: number;
  /** subtotal (after discounts) at/above which shipping is free; 0/undefined = never */
  freeShippingThreshold?: number;
  codFee?: number;
  /** tax rate in basis points (1500 = 15%); null/0 = none */
  taxRateBp?: number;
  taxInclusive?: boolean;
};

export type Totals = {
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  discount: number;
  shipping: number;
  codFee: number;
  tax: number;
  total: number;
  freeShippingApplied: boolean;
  couponError?: "min_subtotal";
  /** per-line price after bundle discount */
  lineTotals: number[];
};

const pct = (amount: number, percent: number) => Math.floor((amount * percent) / 100);

export function bestBundlePercent(productId: string, qty: number, bundles: BundleRule[] = []): number {
  let best = 0;
  for (const b of bundles) {
    if ((b.productId === null || b.productId === productId) && qty >= b.minQty && b.percent > best) best = b.percent;
  }
  return Math.min(best, 100);
}

export function computeTotals(input: TotalsInput): Totals {
  const { lines, bundles = [], coupon, shippingFee, freeShippingThreshold = 0, codFee = 0, taxRateBp = 0, taxInclusive = false } = input;

  let subtotal = 0;
  let bundleDiscount = 0;
  const lineTotals: number[] = [];
  for (const l of lines) {
    const gross = l.unitPrice * l.qty;
    const d = pct(gross, bestBundlePercent(l.productId, l.qty, bundles));
    subtotal += gross;
    bundleDiscount += d;
    lineTotals.push(gross - d);
  }

  const afterBundle = subtotal - bundleDiscount;
  let couponDiscount = 0;
  let freeShipCoupon = false;
  let couponError: Totals["couponError"];
  if (coupon) {
    if (afterBundle < coupon.minSubtotal) couponError = "min_subtotal";
    else if (coupon.type === "percent") couponDiscount = pct(afterBundle, Math.min(coupon.value, 100));
    else if (coupon.type === "fixed") couponDiscount = Math.min(coupon.value, afterBundle);
    else freeShipCoupon = true;
  }

  const discount = bundleDiscount + couponDiscount;
  const net = subtotal - discount;
  const freeByThreshold = freeShippingThreshold > 0 && net >= freeShippingThreshold;
  const freeShippingApplied = freeShipCoupon || freeByThreshold;
  const shipping = freeShippingApplied || lines.length === 0 ? 0 : shippingFee;

  let tax = 0;
  if (taxRateBp > 0) {
    tax = taxInclusive ? Math.round((net * taxRateBp) / (10000 + taxRateBp)) : Math.round((net * taxRateBp) / 10000);
  }
  const total = net + shipping + codFee + (taxInclusive ? 0 : tax);

  return { subtotal, bundleDiscount, couponDiscount, discount, shipping, codFee, tax, total, freeShippingApplied, couponError, lineTotals };
}

/** Amount still needed to unlock free shipping (0 when reached or disabled). */
export function freeShippingRemaining(net: number, threshold: number): number {
  return threshold > 0 ? Math.max(0, threshold - net) : 0;
}
