import { requirePerm } from "@/lib/auth";
import { PageHeader, Panel } from "@/features/admin/components/ui";
import { ImportForm } from "@/features/catalog-admin/import-form";

export const metadata = { title: "Import products" };

export default async function ImportPage() {
  await requirePerm("products.edit");
  return (
    <>
      <PageHeader title="Import products" sub="Upsert by slug from a CSV file" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Upload"><ImportForm /></Panel>
        <Panel title="Format">
          <p className="mb-2 text-sm text-muted">First row = headers. Prices are in major units (e.g. 129.90). Unknown columns are ignored. Variants aren’t part of the CSV — add them in the product editor.</p>
          <pre className="overflow-x-auto rounded-lg bg-sunken p-3 text-xs" dir="ltr">{`slug,name_en,name_fr,name_ar,short_en,description_en,price,compare_at,stock,sku,category,status,featured,image
ceramic-pan,Ceramic pan,Poêle céramique,مقلاة سيراميك,Non-stick,Long text,249,349,40,SKU-1,home,published,1,https://…/pan.jpg`}</pre>
          <a href="/admin/products/export" className="btn btn-outline btn-sm mt-3">Download current catalog as template</a>
        </Panel>
      </div>
    </>
  );
}
