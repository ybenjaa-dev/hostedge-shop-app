import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getAdminProduct, listCategoryOptions } from "@/features/catalog-admin/queries";
import { ProductForm } from "@/features/catalog-admin/product-form";
import { PageHeader } from "@/features/admin/components/ui";
import { getSettings } from "@/lib/settings";
import { parseI18n, tr } from "@/lib/i18n-core";
import { toMajorString } from "@/lib/money";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [d, cats, s] = await Promise.all([getAdminProduct(id), listCategoryOptions(), getSettings()]);
  if (!d) notFound();
  const { p } = d;
  const cur = s.store.currency;
  return (
    <>
      <PageHeader title={tr(p.name as string, "en") || "Product"} actions={p.status === "published" ? <Link target="_blank" href={`/p/${p.slug}`} className="btn btn-outline btn-sm"><ExternalLink className="size-4" />View in store</Link> : undefined} />
      <ProductForm
        storeTemplate={s.offers.template}
        currency={s.store.currency}
        categories={cats.map((c) => ({ id: c.id, label: tr(c.name, "en") }))}
        data={{
          id: p.id as string, slug: p.slug as string, name: parseI18n(p.name as string), shortDesc: parseI18n(p.short_desc as string), longDesc: parseI18n(p.long_desc as string), specs: parseI18n(p.specs as string), seoTitle: parseI18n(p.seo_title as string), seoDesc: parseI18n(p.seo_desc as string),
          categoryId: (p.category_id as string) ?? "", sku: (p.sku as string) ?? "", price: toMajorString(p.price as number, cur), compareAt: p.compare_at ? toMajorString(p.compare_at as number, cur) : "", stock: p.stock as number, trackStock: !!p.track_stock, status: p.status as "draft" | "published", featured: !!p.featured, bestseller: !!p.bestseller,
          images: d.images.map((i) => ({ key: i.key, alt: i.alt })),
          offerTemplate: (p.offer_template as string | null) ?? "",
          offers: d.offers.map((o) => ({ qty: o.qty, price: toMajorString(o.price, cur), label: o.label ?? "", popular: !!o.popular, image: o.image ?? "" })),
          variants: d.variants.map((v) => ({ id: v.id, name: v.name, options: JSON.parse(v.options || "{}"), sku: v.sku ?? "", price: v.price != null ? toMajorString(v.price, cur) : "", stock: v.stock })),
        }}
      />
    </>
  );
}
