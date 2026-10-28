import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { getEnv } from "@/lib/env";
import { listBundles, listCities, getProduct } from "@/features/catalog/queries";
import { CartCheckout } from "@/features/checkout/components/cart-view";
import { OrderForm } from "@/features/checkout/components/order-form";
import { formatMoney } from "@/lib/money";
import { fileUrl } from "@/lib/storage";
import { resolveExtras } from "@/features/catalog/links";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ p?: string; v?: string; q?: string; x?: string; coupon?: string }> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const { lang, t } = await getT();
  const [bundles, cities] = await Promise.all([listBundles(), listCities(s.store.country)]);

  // COD mode: dedicated checkout page for a single product (form placement = "page")
  if (s.checkout.codMode) {
    if (!sp.p) redirect("/shop");
    const slugRow = await getEnv().DB.prepare("SELECT slug FROM products WHERE id = ?").bind(sp.p).first<{ slug: string }>();
    const p = slugRow ? await getProduct(slugRow.slug) : null;
    if (!p) redirect("/shop");
    const v = p.variants.find((x) => x.id === sp.v);
    if (p.variants.length && !v) redirect(`/p/${p.slug}`);
    const qty = Math.max(1, Math.min(99, parseInt(sp.q ?? "1", 10) || 1));
    const unit = v?.price ?? p.price;
    const extras = await resolveExtras(sp.x, p.id);
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="display mb-6 text-3xl font-extrabold">{t("cod.title")}</h1>
        <OrderForm
          source="checkout-page" productName={tr(p.name, lang)} bundles={bundles} cities={cities}
          lines={[{ productId: p.id, variantId: v?.id ?? null, name: p.name, variantName: v?.name ?? null, unitPrice: unit, qty, image: p.images[0]?.key ?? null }, ...extras]}
          header={
            <div className="card flex items-center gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.images[0] && <img src={fileUrl(p.images[0].key, "thumb")} alt="" className="size-16 rounded-lg object-cover" />}
              <div className="min-w-0"><p className="truncate font-bold">{tr(p.name, lang)}</p><p className="text-sm text-muted">{v?.name} · {qty} × <bdi dir="ltr">{formatMoney(unit, s.store.currency, lang)}</bdi></p>{extras.length > 0 && <p className="mt-0.5 truncate text-xs text-muted">+ {extras.map((e) => tr(e.name, lang)).join(" · ")}</p>}</div>
            </div>
          }
        />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="display mb-6 text-3xl font-extrabold sm:text-4xl">{t("checkout.title")}</h1>
      <CartCheckout bundles={bundles} cities={cities} coupon={sp.coupon} />
    </div>
  );
}
