import Link from "next/link";
import { Plus, Upload, Download } from "lucide-react";
import { listAdminProducts, listCategoryOptions } from "@/features/catalog-admin/queries";
import { getSettings } from "@/lib/settings";
import { tr } from "@/lib/i18n-core";
import { PageHeader, Empty, Pager, FilterBar, FbItem } from "@/features/admin/components/ui";
import { ProductsTable } from "@/features/catalog-admin/products-table";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const [{ rows, total, perPage }, cats, s] = await Promise.all([listAdminProducts({ q: sp.q, status: sp.status, category: sp.category, page }), listCategoryOptions(), getSettings()]);
  const catOpts = cats.map((c) => ({ id: c.id, label: tr(c.name, "en") }));
  return (
    <>
      <PageHeader title="Products" sub={`${total} product${total === 1 ? "" : "s"}`} actions={<>
        <Link href="/admin/products/import" className="btn btn-outline btn-sm"><Upload className="size-4" />Import CSV</Link>
        <a href="/admin/products/export" className="btn btn-outline btn-sm"><Download className="size-4" />Export CSV</a>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm"><Plus className="size-4" />New product</Link></>} />
      <FilterBar>
        <FbItem grow><input name="q" defaultValue={sp.q} placeholder="Search name, SKU…" aria-label="Search" className="field" /></FbItem>
        <FbItem><select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="field"><option value="">Any status</option><option value="published">Published</option><option value="draft">Draft</option></select></FbItem>
        <FbItem><select name="category" defaultValue={sp.category ?? ""} aria-label="Category" className="field"><option value="">All categories</option>{catOpts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></FbItem>
      </FilterBar>
      {rows.length === 0 ? <Empty title="No products" hint="Create your first product or import a CSV." action={<Link href="/admin/products/new" className="btn btn-primary btn-sm">New product</Link>} /> : <ProductsTable rows={rows} currency={s.store.currency} categories={catOpts} />}
      <Pager page={page} pages={Math.max(1, Math.ceil(total / perPage))} base="/admin/products" params={sp} />
    </>
  );
}
