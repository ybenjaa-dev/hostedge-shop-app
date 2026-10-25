import { requirePerm } from "@/lib/auth";
import { listCategoryOptions } from "@/features/catalog-admin/queries";
import { listProductPicks } from "@/features/catalog-admin/queries";
import { ProductForm } from "@/features/catalog-admin/product-form";
import { PageHeader } from "@/features/admin/components/ui";
import { tr } from "@/lib/i18n-core";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  await requirePerm("products.edit");
  const [cats, s] = await Promise.all([listCategoryOptions(), getSettings()]);
  return (
    <>
      <PageHeader title="New product" />
      <ProductForm otherProducts={await listProductPicks()} storeTemplate={s.offers.template} currency={s.store.currency} categories={cats.map((c) => ({ id: c.id, label: tr(c.name, "en") }))} data={{ slug: "", name: {}, shortDesc: {}, longDesc: {}, specs: {}, seoTitle: {}, seoDesc: {}, categoryId: "", sku: "", price: "", compareAt: "", stock: 0, trackStock: true, status: "draft", featured: false, bestseller: false, images: [], variants: [], offers: [], offerTemplate: "", together: [], addon: [] }} />
    </>
  );
}
