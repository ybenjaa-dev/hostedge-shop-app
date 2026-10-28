import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { tr } from "@/lib/i18n-core";
import { formatPhoneIntl } from "@/lib/phone";
import { Panel, PageHeader } from "@/features/admin/components/ui";
import { ConvertForm, type ProductOption } from "@/features/abandoned/components/convert-form";
import { getAbandoned } from "@/features/abandoned/queries";
import { lineLabel } from "@/features/abandoned/lib";
import { rowE164, rowLines } from "@/features/abandoned/view";

export const metadata = { title: "Convert to order" };

export default async function ConvertPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePerm("orders.confirm");
  const { id } = await params;
  const r = await getAbandoned(id);
  if (!r) notFound();
  if (r.status === "converted") redirect(r.convertedOrderId ? `/admin/orders/${r.convertedOrderId}` : `/admin/abandoned/${id}`);
  const s = await getSettings();
  const db = getEnv().DB;
  const [cities, ps, vs] = await db.batch([
    db.prepare("SELECT id, name FROM cities WHERE active = 1 ORDER BY name"),
    db.prepare("SELECT id, name, price FROM products WHERE status = 'published' ORDER BY name LIMIT 500"),
    db.prepare("SELECT v.id, v.product_id, v.name, v.price FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.status = 'published'"),
  ]);
  const prods = ps!.results as { id: string; name: string; price: number }[];
  const vars = vs!.results as { id: string; product_id: string; name: string; price: number | null }[];
  const products: ProductOption[] = prods.flatMap((p): ProductOption[] => {
    const pv = vars.filter((v) => v.product_id === p.id);
    const nm = tr(p.name, "en", "fr");
    return pv.length
      ? pv.map((v) => ({ key: `${p.id}:${v.id}`, productId: p.id, variantId: v.id, label: `${nm} — ${tr(v.name, "en", "fr")}`, price: v.price ?? p.price }))
      : [{ key: p.id, productId: p.id, variantId: null, label: nm, price: p.price }];
  });
  const e164 = rowE164(r, s.store.country);
  const lines = rowLines(r).map((l) => {
    const known = products.find((p) => p.productId === l.productId && p.variantId === l.variantId);
    return { ...l, label: lineLabel(l) || known?.label || "Product", unitPrice: l.unitPrice || known?.price || 0 };
  });
  const extra = (() => { try { return JSON.parse(r.extra ?? "{}") as { customerNotes?: string }; } catch { return {}; } })();
  return (
    <div className="max-w-3xl">
      <Link href={`/admin/abandoned/${id}`} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4" aria-hidden />Back to the checkout</Link>
      <PageHeader title="Convert to order" sub={`Creates a real order for ${r.name || (e164 ? formatPhoneIntl(e164) : "this customer")} with the store's normal pricing, offers and stock checks.`} />
      <Panel>
        <ConvertForm id={r.id} currency={s.store.currency} cities={cities!.results as { id: string; name: string }[]} products={products}
          initial={{ name: r.name ?? "", phone: e164 ? `+${e164}` : r.phone ?? "", city: r.city ?? "", address: r.address ?? "", notes: extra.customerNotes ?? "", coupon: r.coupon ?? "", lines }} />
      </Panel>
    </div>
  );
}
