import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { listCategories, listPages } from "@/features/catalog/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { StoreProvider } from "@/features/checkout/store-context";
import { DICT } from "@/lib/dict";
import { CartDrawer } from "@/features/checkout/components/cart-drawer";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  if (!s.setupDone) redirect("/setup");
  const { lang, t } = await getT();
  const [cats, pages] = await Promise.all([listCategories(), listPages()]);
  const store = { lang, currency: s.store.currency, codMode: s.checkout.codMode, placement: s.checkout.formPlacement, codFee: s.checkout.codFee, defaultShippingFee: s.checkout.defaultShippingFee, freeThreshold: s.checkout.freeShippingThreshold, taxRateBp: s.store.taxRateBp, taxInclusive: s.store.taxInclusive, country: s.store.country, countries: s.store.countries, whatsapp: s.store.whatsapp, bundlesInForm: s.checkout.bundlesInForm, dict: DICT[lang] };
  return (
    <StoreProvider value={store}>
      <div className="v9">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-ink">{t("common.skip")}</a>
      <SiteHeader s={s} lang={lang} t={t} categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} />
      <main id="main">{children}</main>
      <SiteFooter s={s} lang={lang} t={t} pages={pages} />
      <WhatsAppFab number={s.store.whatsapp} label={t("common.whatsapp")} />
      {!s.checkout.codMode && <CartDrawer currency={s.store.currency} lang={lang} threshold={s.checkout.freeShippingThreshold} labels={{ title: t("cart.title"), empty: t("cart.empty"), view: t("cart.view"), checkout: t("cart.checkout"), remove: t("cart.remove"), subtotal: t("cod.subtotal"), freeHint: t("cod.freeShipHint", { amount: "{amount}" }), freeOk: t("cod.freeShipOk"), close: t("cod.close") }} />}
      </div>
    </StoreProvider>
  );
}
