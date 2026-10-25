import { asc, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { tr, parseI18n } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, I18nField, ImageField, Toggle } from "@/features/admin/components/fields";
import { Badge, Empty, PageHeader } from "@/features/admin/components/ui";
import { DataTable } from "@/features/settings/components/table";
import { Drawer } from "@/features/admin/components/drawer";
import { saveCategory, deleteCategory } from "@/features/catalog-admin/category-actions";
import { DeleteCategory } from "@/features/catalog-admin/components/delete-category";

export const metadata = { title: "Categories" };
type Cat = typeof schema.categories.$inferSelect;

function CategoryForm({ c, nextPos }: { c?: Cat; nextPos?: number }) {
  const k = c?.id ?? "new";
  return (
    <AdminForm action={saveCategory} submitLabel={c ? "Save category" : "Create category"} resetOnSuccess={!c}>
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <I18nField label="Name" name="name" value={c ? parseI18n(c.name) : {}} />
      <ImageField label="Image" name="image" value={c?.image ?? ""} hint="Shown on the homepage tiles." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug" htmlFor={`slug-${k}`} hint="Leave empty to generate from the name."><input id={`slug-${k}`} name="slug" defaultValue={c?.slug} maxLength={80} dir="ltr" className="field" /></Field>
        <Field label="Position" htmlFor={`pos-${k}`}><input id={`pos-${k}`} name="position" type="number" min={0} max={9999} defaultValue={c?.position ?? nextPos ?? 0} className="field num" /></Field>
      </div>
      <Toggle name="active" label="Active" hint="Inactive categories are hidden from the storefront." defaultChecked={c?.active ?? true} />
    </AdminForm>
  );
}

export default async function CategoriesPage() {
  await requireUser();
  const db = getDb();
  const [cats, counts] = await Promise.all([
    db.select().from(schema.categories).orderBy(asc(schema.categories.position), asc(schema.categories.slug)),
    db.select({ id: schema.products.categoryId, n: sql<number>`count(*)` }).from(schema.products).groupBy(schema.products.categoryId),
  ]);
  const countOf = new Map(counts.map((c) => [c.id, c.n]));
  const others = (id: string) => cats.filter((o) => o.id !== id).map((o) => ({ id: o.id, name: tr(o.name, "en") || o.slug }));
  return (
    <div>
      <PageHeader title="Categories" sub="Group products for navigation and filters."
        actions={<Drawer trigger={<><Plus className="size-4" aria-hidden />New category</>} triggerClassName="btn btn-primary btn-sm" title="New category" sub="Shown in the menu and as a tile on the home page."><CategoryForm nextPos={cats.length} /></Drawer>} />
      {cats.length === 0 ? <Empty title="No categories yet" hint="Create your first category with the button above." /> : (
        <DataTable minWidth="40rem" head={["Category", "Slug", { label: "Products", end: true }, "Status", { label: "", end: true, narrow: true }]}>
          {cats.map((c) => {
            const n = countOf.get(c.id) ?? 0;
            const name = tr(c.name, "en") || tr(c.name, "fr") || c.slug;
            return (
              <tr key={c.id}>
                <td><div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-sunken">{c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "thumb")} alt="" className="size-full object-cover" />}</span>
                  <span className="font-semibold">{name}</span></div></td>
                <td className="text-muted" dir="ltr"><span className="text-start">/{c.slug}</span></td>
                <td className="num is-end">{n}</td>
                <td>{c.active ? <Badge color="#16a34a">Active</Badge> : <Badge>Hidden</Badge>}</td>
                <td className="is-end"><Drawer trigger="Edit" title={name} sub={`${n} product${n === 1 ? "" : "s"}`}>
                  <div className="space-y-6"><CategoryForm c={c} />
                    <div className="border-t border-line pt-4"><DeleteCategory id={c.id} name={name} count={n} others={others(c.id)} action={deleteCategory} /></div></div>
                </Drawer></td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
