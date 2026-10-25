import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { tr } from "@/lib/i18n-core";
import type { Settings } from "@/lib/settings";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, Toggle } from "@/features/admin/components/fields";
import { Badge, Panel } from "@/features/admin/components/ui";
import { OfferTemplatePicker } from "@/features/catalog-admin/components/offer-template-picker";
import { saveBundle, saveOfferTemplate, saveUpsell, deleteBundle } from "@/features/catalog-admin/promo-actions";
import { ActionButton } from "./action-button";
import { DataTable } from "./table";

/** Store-wide offer defaults. Fixed-price quantity offers ("2 for 229") live on each product. */
export async function OffersSection({ s }: { s: Settings }) {
  const db = getDb();
  const [bundles, prods] = await Promise.all([
    db.select().from(schema.bundles).orderBy(asc(schema.bundles.minQty)),
    db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products).limit(500),
  ]);
  const nameOf = new Map(prods.map((p) => [p.id, tr(p.name, "en") || p.id]));
  const pct = bundles.filter((b) => b.price == null);
  return (
    <>
      <Panel title="Offer card layout">
        <p className="mb-3 text-sm text-muted">How the “1 for 129 · 2 for 229 · 3 for 319” cards look on product pages. This is the default for every product — a product can pick its own layout in the <b>Quantity offers</b> section of its page. <Link href="/admin/products" className="font-bold text-brand underline">Set offers on a product</Link></p>
        <AdminForm action={saveOfferTemplate} submitLabel="Save layout for all products"><OfferTemplatePicker name="template" value={s.offers.template} /></AdminForm>
      </Panel>
      <Panel title="One-tap add-on after checkout">
        <p className="mb-3 text-sm text-muted">Right after a customer places an order, offer one or two companion products (chosen on each product under <b>Cross-sell</b>) at a special price. One tap adds them to the same order — no new form, still pay on delivery. Free delivery is unlocked automatically if the new total passes your threshold.</p>
        <AdminForm action={saveUpsell} submitLabel="Save add-on offer">
          <Toggle name="enabled" label="Show the add-on offer" defaultChecked={s.offers.upsell.enabled} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Discount on the add-on (%)" htmlFor="up-pct" hint="0 = same price as in the shop."><input id="up-pct" name="discountPct" type="number" min={0} max={70} defaultValue={s.offers.upsell.discountPct} className="field num" /></Field>
            <Field label="Offer available for (minutes)" htmlFor="up-win" hint="After this the order goes straight to the thank-you page. It also closes once the order is confirmed."><input id="up-win" name="windowMin" type="number" min={5} max={240} defaultValue={s.offers.upsell.windowMin} className="field num" /></Field>
          </div>
        </AdminForm>
      </Panel>
      <Panel title="Store-wide percentage rule" actions={<span className="text-xs text-muted">optional</span>}>
        <p className="mb-3 text-sm text-muted">“Buy 3 or more, save 15%” applied automatically to products without their own quantity offers.</p>
        <AdminForm action={saveBundle} submitLabel="Add rule" resetOnSuccess>
          <input type="hidden" name="id" value="" /><input type="hidden" name="productId" value="" /><input type="hidden" name="image" value="" /><input type="hidden" name="active" value="1" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Buy at least (qty)" htmlFor="pr-qty"><input id="pr-qty" name="minQty" type="number" min={2} max={1000} required defaultValue={3} className="field num" /></Field>
            <Field label="Save (%)" htmlFor="pr-pct"><input id="pr-pct" name="percent" type="number" min={1} max={90} required defaultValue={10} className="field num" /></Field>
          </div>
        </AdminForm>
        {pct.length > 0 && (
          <div className="mt-5"><DataTable minWidth="26rem" head={["Rule", "Applies to", "Status", { label: "", end: true, narrow: true }]}>
            {pct.map((b) => (
              <tr key={b.id}>
                <td className="font-semibold">Buy {b.minQty}+, save {b.percent}%</td>
                <td className="text-muted">{b.productId ? nameOf.get(b.productId) ?? "Deleted product" : "All products"}</td>
                <td>{b.active ? <Badge color="#16a34a">Active</Badge> : <Badge>Inactive</Badge>}</td>
                <td className="is-end"><ActionButton action={deleteBundle} fields={{ id: b.id }} confirm="Delete this rule?" className="btn btn-ghost btn-sm text-danger">Delete</ActionButton></td>
              </tr>
            ))}
          </DataTable></div>
        )}
      </Panel>
    </>
  );
}
