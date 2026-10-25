import "server-only";
import { getEnv } from "@/lib/env";
import { computeTotals, type CouponRule, type Totals } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { listBundles } from "@/features/catalog/queries";
import type { QuoteInput } from "./schema";

export type ResolvedLine = {
  productId: string;
  variantId: string | null;
  name: string; // raw i18n JSON
  variantName: string | null;
  sku: string | null;
  unitPrice: number;
  qty: number;
  image: string | null;
  available: number | null; // null = untracked
};

export type Quote = {
  lines: ResolvedLine[];
  totals: Totals;
  city: { id: string; name: string; codAvailable: boolean; country: string } | null;
  coupon: { code: string; type: string } | null;
  couponStatus: "none" | "ok" | "invalid" | "expired" | "min_subtotal" | "exhausted";
  freeShippingThreshold: number;
  errors: { productId: string; reason: "unavailable" | "stock" | "variant" }[];
  currency: string;
};

type PRow = { id: string; name: string; price: number; stock: number; track_stock: number; status: string; sku: string | null; image: string | null };
type VRow = { id: string; product_id: string; name: string; price: number | null; stock: number; sku: string | null };

/** Server-side authoritative pricing: never trusts prices from the client. */
export async function buildQuote(input: QuoteInput, opts: { applyCodFee?: boolean } = {}): Promise<Quote> {
  const s = await getSettings();
  const db = getEnv().DB;
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const ph = ids.map(() => "?").join(",");
  const [ps, vs] = await db.batch([
    db.prepare(`SELECT p.id, p.name, p.price, p.stock, p.track_stock, p.status, p.sku, (SELECT key FROM product_images i WHERE i.product_id=p.id ORDER BY position LIMIT 1) AS image FROM products p WHERE p.id IN (${ph})`).bind(...ids),
    db.prepare(`SELECT id, product_id, name, price, stock, sku FROM product_variants WHERE product_id IN (${ph})`).bind(...ids),
  ]);
  const products = new Map((ps!.results as PRow[]).map((p) => [p.id, p]));
  const variants = (vs!.results as VRow[]) ?? [];

  const errors: Quote["errors"] = [];
  const lines: ResolvedLine[] = [];
  const need = new Map<string, number>(); // aggregate qty per stock bucket
  for (const it of input.items) {
    const p = products.get(it.productId);
    if (!p || p.status !== "published") {
      errors.push({ productId: it.productId, reason: "unavailable" });
      continue;
    }
    const pv = variants.filter((v) => v.product_id === p.id);
    let v: VRow | undefined;
    if (pv.length) {
      v = pv.find((x) => x.id === it.variantId);
      if (!v) {
        errors.push({ productId: p.id, reason: "variant" });
        continue;
      }
    }
    const bucket = v ? `v:${v.id}` : `p:${p.id}`;
    const total = (need.get(bucket) ?? 0) + it.qty;
    need.set(bucket, total);
    const stock = v ? v.stock : p.stock;
    const tracked = !!p.track_stock;
    if (tracked && total > stock) errors.push({ productId: p.id, reason: "stock" });
    lines.push({
      productId: p.id,
      variantId: v?.id ?? null,
      name: p.name,
      variantName: v?.name ?? null,
      sku: v?.sku ?? p.sku,
      unitPrice: v?.price ?? p.price,
      qty: it.qty,
      image: p.image,
      available: tracked ? stock : null,
    });
  }

  let city: Quote["city"] = null;
  let cityFee: number | null = null;
  let cityFree: number | null = null;
  if (input.cityId) {
    const c = await db.prepare("SELECT id, name, country, fee, free_above, cod_available FROM cities WHERE id = ? AND active = 1").bind(input.cityId).first<{ id: string; name: string; country: string; fee: number | null; free_above: number | null; cod_available: number }>();
    if (c) {
      city = { id: c.id, name: c.name, country: c.country, codAvailable: !!c.cod_available };
      cityFee = c.fee;
      cityFree = c.free_above;
    }
  }

  let coupon: CouponRule | null = null;
  let couponStatus: Quote["couponStatus"] = "none";
  if (input.couponCode) {
    const row = await db.prepare("SELECT * FROM coupons WHERE code = ? AND active = 1").bind(input.couponCode.trim().toUpperCase()).first<Record<string, number | string | null>>();
    const now = Date.now();
    if (!row) couponStatus = "invalid";
    else if ((row.starts_at && (row.starts_at as number) > now) || (row.ends_at && (row.ends_at as number) < now)) couponStatus = "expired";
    else if (row.max_uses != null && (row.used as number) >= (row.max_uses as number)) couponStatus = "exhausted";
    else {
      coupon = { code: row.code as string, type: row.type as CouponRule["type"], value: row.value as number, minSubtotal: row.min_subtotal as number };
      couponStatus = "ok";
    }
  }

  const bundles = await listBundles();
  const threshold = cityFree ?? s.checkout.freeShippingThreshold;
  const totals = computeTotals({
    lines: lines.map((l) => ({ productId: l.productId, unitPrice: l.unitPrice, qty: l.qty })),
    bundles,
    coupon,
    shippingFee: cityFee ?? s.checkout.defaultShippingFee,
    freeShippingThreshold: threshold,
    codFee: opts.applyCodFee === false ? 0 : s.checkout.codFee,
    taxRateBp: s.store.taxRateBp,
    taxInclusive: s.store.taxInclusive,
  });
  if (totals.couponError) couponStatus = "min_subtotal";

  return { lines, totals, city, coupon: coupon ? { code: coupon.code, type: coupon.type } : null, couponStatus, freeShippingThreshold: threshold, errors, currency: s.store.currency };
}
