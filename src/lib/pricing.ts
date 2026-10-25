/** Pure pricing engine. All amounts are integer minor units — no floating point money. */

export type PriceLine = { productId: string; unitPrice: number; qty: number };
export type BundleRule = {
  productId: string | null;
  minQty: number;
  percent: number;
  /** Fixed-price offer: total price of exactly `minQty` units at the product's base price ("buy 2 for 229"). Overrides `percent` for this tier. */
  price?: number | null;
  /** The product's base price the fixed price was set against — lets the pack price scale for variants with another price. */
  basePrice?: number | null;
  label?: string | null;
  popular?: boolean;
  /** Picture for the offer card (R2 key). */
  image?: string | null;
  /** Offer-card layout to render for this product (product choice, else store default). Set by listBundles(productId). */
  template?: string | null;
};
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

/** Price of one fixed-price pack at this unit price (scaled for variants priced differently from the base), never above the single-unit price × pack size. */
function packPrice(t: BundleRule, unit: number): number {
  const scaled = t.basePrice && t.basePrice > 0 ? Math.round((t.price! * unit) / t.basePrice) : t.price!;
  return Math.min(t.minQty * unit, scaled);
}

/** Fixed-price tiers for a product, ascending by pack size. */
export function fixedTiers(productId: string, bundles: BundleRule[] = []): BundleRule[] {
  return bundles
    .filter((b) => b.productId === productId && b.price != null && b.price > 0 && b.minQty >= 2)
    .sort((a, b) => a.minQty - b.minQty);
}

/**
 * What `qty` units of a product cost after bundles: the cheapest of the plain price, the best percentage tier and the best
 * combination of fixed-price packs (e.g. with "2 for 229" and "3 for 319", 5 units = 229 + 319). Never above unit × qty.
 */
export function bundleLineTotal(productId: string, unit: number, qty: number, bundles: BundleRule[] = []): number {
  const gross = unit * qty;
  let best = gross - pct(gross, bestBundlePercent(productId, qty, bundles));
  const tiers = fixedTiers(productId, bundles);
  if (tiers.length && qty >= tiers[0]!.minQty && qty <= 5000) {
    const packs = tiers.map((t) => ({ n: t.minQty, price: packPrice(t, unit) }));
    const dp = new Array<number>(qty + 1).fill(0);
    for (let q = 1; q <= qty; q++) {
      let v = dp[q - 1]! + unit;
      for (const p of packs) if (q >= p.n) v = Math.min(v, dp[q - p.n]! + p.price);
      dp[q] = v;
    }
    best = Math.min(best, dp[qty]!);
  }
  return Math.min(gross, best);
}

export type Offer = { qty: number; total: number; compareAt: number; perUnit: number; savePct: number; saved: number; label: string | null; popular: boolean; best: boolean; image: string | null };

/** Offer cards for the product page: 1 unit at the normal price, then one card per tier size (fixed-price or percentage) with the real price after bundles. */
export function offersFor(productId: string, unit: number, bundles: BundleRule[] = []): Offer[] {
  const sizes = new Set<number>();
  for (const b of bundles) if ((b.productId === null || b.productId === productId) && b.minQty >= 2 && (b.price != null ? b.price > 0 : b.percent > 0)) sizes.add(b.minQty);
  const list = [1, ...[...sizes].sort((a, b) => a - b)].map((qty) => {
    const total = bundleLineTotal(productId, unit, qty, bundles);
    const compareAt = unit * qty;
    const meta = bundles.find((b) => b.productId === productId && b.minQty === qty && b.price != null);
    const image = meta?.image ?? bundles.find((b) => (b.productId === productId || b.productId === null) && b.minQty === qty && b.image)?.image ?? null;
    return { qty, total, compareAt, perUnit: Math.round(total / qty), savePct: compareAt > 0 ? Math.round(((compareAt - total) / compareAt) * 100) : 0, saved: compareAt - total, label: meta?.label ?? null, popular: !!meta?.popular, best: false, image };
  });
  if (list.length > 1) {
    const bestIdx = list.reduce((bi, o, i) => (o.savePct > list[bi]!.savePct ? i : bi), 0);
    if (list[bestIdx]!.savePct > 0 && !list.some((o) => o.popular && o.qty === list[bestIdx]!.qty)) list[bestIdx]!.best = true;
  }
  return list;
}

export function computeTotals(input: TotalsInput): Totals {
  const { lines, bundles = [], coupon, shippingFee, freeShippingThreshold = 0, codFee = 0, taxRateBp = 0, taxInclusive = false } = input;

  let subtotal = 0;
  let bundleDiscount = 0;
  const lineTotals: number[] = [];
  for (const l of lines) {
    const gross = l.unitPrice * l.qty;
    const d = gross - bundleLineTotal(l.productId, l.unitPrice, l.qty, bundles);
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
