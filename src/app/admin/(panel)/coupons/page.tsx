import { asc, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { formatMoney, toMajorString } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, Toggle } from "@/features/admin/components/fields";
import { Badge, Empty, PageHeader, Panel } from "@/features/admin/components/ui";
import { nowMs } from "@/features/settings/lib";
import { ActionButton } from "@/features/settings/components/action-button";
import { CouponTypeValue } from "@/features/catalog-admin/components/coupon-fields";
import { saveCoupon, deleteCoupon, saveBundle, deleteBundle } from "@/features/catalog-admin/promo-actions";

export const metadata = { title: "Coupons & bundles" };
type Coupon = typeof schema.coupons.$inferSelect;
type Bundle = typeof schema.bundles.$inferSelect;
const day = (ms: number | null) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");

function CouponForm({ c, cur }: { c?: Coupon; cur: string }) {
  const k = c?.id ?? "new";
  return (
    <AdminForm action={saveCoupon} submitLabel={c ? "Save coupon" : "Create coupon"} resetOnSuccess={!c}>
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Code" htmlFor={`${k}-code`}><input id={`${k}-code`} name="code" required defaultValue={c?.code} maxLength={30} dir="ltr" autoCapitalize="characters" className="field uppercase" /></Field>
        <CouponTypeValue idp={k} type={c?.type} currency={cur} value={c ? (c.type === "fixed" ? toMajorString(c.value, cur) : c.type === "percent" ? String(c.value) : "") : ""} />
        <Field label={`Minimum subtotal (${cur})`} htmlFor={`${k}-min`} hint="0 = no minimum"><input id={`${k}-min`} name="minSubtotal" inputMode="decimal" defaultValue={toMajorString(c?.minSubtotal ?? 0, cur)} className="field num" /></Field>
        <Field label="Max uses" htmlFor={`${k}-max`} hint="Empty = unlimited"><input id={`${k}-max`} name="maxUses" type="number" min={1} defaultValue={c?.maxUses ?? ""} className="field num" /></Field>
        <Field label="Starts" htmlFor={`${k}-from`}><input id={`${k}-from`} name="startsAt" type="date" defaultValue={day(c?.startsAt ?? null)} className="field" /></Field>
        <Field label="Ends" htmlFor={`${k}-to`}><input id={`${k}-to`} name="endsAt" type="date" defaultValue={day(c?.endsAt ?? null)} className="field" /></Field>
      </div>
      <Toggle name="active" label="Active" defaultChecked={c?.active ?? true} />
    </AdminForm>
  );
}

function BundleForm({ b, products }: { b?: Bundle; products: { id: string; name: string }[] }) {
  const k = b?.id ?? "new";
  return (
    <AdminForm action={saveBundle} submitLabel={b ? "Save bundle" : "Create bundle"} resetOnSuccess={!b}>
      <input type="hidden" name="id" value={b?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Applies to" htmlFor={`${k}-prod`}><select id={`${k}-prod`} name="productId" defaultValue={b?.productId ?? ""} className="field"><option value="">All products</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Buy at least (qty)" htmlFor={`${k}-qty`}><input id={`${k}-qty`} name="minQty" type="number" min={2} max={1000} required defaultValue={b?.minQty ?? 2} className="field num" /></Field>
        <Field label="Save (%)" htmlFor={`${k}-pct`}><input id={`${k}-pct`} name="percent" type="number" min={1} max={90} required defaultValue={b?.percent ?? 10} className="field num" /></Field>
      </div>
      <Toggle name="active" label="Active" defaultChecked={b?.active ?? true} />
    </AdminForm>
  );
}

export default async function CouponsPage() {
  await requireUser();
  const db = getDb();
  const s = await getSettings();
  const cur = s.store.currency;
  const [coupons, bundles, prods] = await Promise.all([
    db.select().from(schema.coupons).orderBy(desc(schema.coupons.active), asc(schema.coupons.code)),
    db.select().from(schema.bundles).orderBy(asc(schema.bundles.minQty)),
    db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products).orderBy(asc(schema.products.slug)).limit(500),
  ]);
  const products = prods.map((p) => ({ id: p.id, name: tr(p.name, "en") || p.id }));
  const nameOf = new Map(products.map((p) => [p.id, p.name]));
  const now = nowMs();
  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader title="Coupons & bundles" sub="Discount codes and quantity discounts." />

      <section aria-labelledby="coupons-h" className="space-y-3">
        <h2 id="coupons-h" className="display text-xl font-extrabold">Coupons</h2>
        <Panel><details><summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><Plus className="size-4" aria-hidden />New coupon</summary><div className="mt-4"><CouponForm cur={cur} /></div></details></Panel>
        {coupons.length === 0 ? <Empty title="No coupons yet" hint="Create a code like WELCOME10 to reward first-time buyers." /> : (
          <ul className="space-y-2">{coupons.map((c) => {
            const expired = c.endsAt != null && c.endsAt < now, upcoming = c.startsAt != null && c.startsAt > now, exhausted = c.maxUses != null && c.used >= c.maxUses;
            return (
              <li key={c.id} className="card"><details className="group">
                <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-3 [&::-webkit-details-marker]:hidden">
                  <code className="rounded bg-sunken px-2 py-1 text-sm font-extrabold" dir="ltr">{c.code}</code>
                  <span className="font-semibold">{c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${formatMoney(c.value, cur)} off` : "Free shipping"}</span>
                  <span className="text-xs text-muted">{c.minSubtotal > 0 ? `min ${formatMoney(c.minSubtotal, cur)} · ` : ""}used <span className="num">{c.used}{c.maxUses != null ? `/${c.maxUses}` : ""}</span>{c.endsAt ? ` · ends ${day(c.endsAt)}` : ""}</span>
                  <span className="ms-auto flex items-center gap-2">{!c.active ? <Badge>Inactive</Badge> : expired ? <Badge color="#dc2626">Expired</Badge> : exhausted ? <Badge color="#d97706">Used up</Badge> : upcoming ? <Badge color="#2563eb">Scheduled</Badge> : <Badge color="#16a34a">Live</Badge>}<span className="btn btn-outline btn-sm">Edit</span></span>
                </summary>
                <div className="space-y-4 border-t border-line p-4"><CouponForm c={c} cur={cur} />
                  <ActionButton action={deleteCoupon} fields={{ id: c.id }} confirm={`Delete coupon ${c.code}?`} className="btn btn-ghost btn-sm text-danger">Delete coupon</ActionButton></div>
              </details></li>
            );
          })}</ul>
        )}
      </section>

      <section aria-labelledby="bundles-h" className="space-y-3">
        <h2 id="bundles-h" className="display text-xl font-extrabold">Quantity bundles</h2>
        <Panel><details><summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><Plus className="size-4" aria-hidden />New bundle</summary><div className="mt-4"><BundleForm products={products} /></div></details></Panel>
        {bundles.length === 0 ? <Empty title="No bundles yet" hint="“Buy 3, save 15%” encourages bigger orders." /> : (
          <ul className="space-y-2">{bundles.map((b) => (
            <li key={b.id} className="card"><details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 p-3 [&::-webkit-details-marker]:hidden">
                <span className="font-bold">{b.price != null ? `Buy ${b.minQty} for ${toMajorString(b.price, cur)}${b.label ? ` · ${b.label}` : ""}` : `Buy ${b.minQty}+, save ${b.percent}%`}</span>
                <span className="text-sm text-muted">{b.productId ? nameOf.get(b.productId) ?? "Deleted product" : "All products"}</span>
                <span className="ms-auto flex items-center gap-2">{b.active ? <Badge color="#16a34a">Active</Badge> : <Badge>Inactive</Badge>}<span className="btn btn-outline btn-sm">Edit</span></span>
              </summary>
              <div className="space-y-4 border-t border-line p-4">{b.price != null ? <p className="text-sm text-muted">Fixed-price offer — edit it in the product\u2019s <b>Quantity offers</b> section.{b.productId && <> <Link href={`/admin/products/${b.productId}`} className="font-bold text-brand underline">Open product</Link></>}</p> : <BundleForm b={b} products={products} />}
                <ActionButton action={deleteBundle} fields={{ id: b.id }} confirm="Delete this bundle?" className="btn btn-ghost btn-sm text-danger">Delete bundle</ActionButton></div>
            </details></li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
