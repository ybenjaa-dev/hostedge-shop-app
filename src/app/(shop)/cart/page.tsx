import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { listBundles } from "@/features/catalog/queries";
import { CartView } from "@/features/checkout/components/cart-view";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const s = await getSettings();
  if (s.checkout.codMode) redirect("/shop"); // COD mode hides the cart page entirely
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="display mb-6 text-3xl font-extrabold sm:text-4xl">{t("cart.title")}</h1>
      <CartView bundles={await listBundles()} />
    </div>
  );
}
