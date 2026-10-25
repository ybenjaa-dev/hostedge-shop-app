import { asc, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { tr, parseI18n } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, I18nField, ImageField, Toggle } from "@/features/admin/components/fields";
import { Badge, Empty, PageHeader, Panel } from "@/features/admin/components/ui";
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
  return (
    <div>
      <PageHeader title="Categories" sub="Group products for navigation and filters." />
      <Panel className="mb-6">
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><Plus className="size-4" aria-hidden />New category</summary>
          <div className="mt-4"><CategoryForm nextPos={cats.length} /></div>
        </details>
      </Panel>
      {cats.length === 0 ? <Empty title="No categories yet" hint="Create your first category above." /> : (
        <ul className="space-y-3">
          {cats.map((c) => {
            const n = countOf.get(c.id) ?? 0;
            return (
              <li key={c.id} className="card">
                <details className="group">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-sunken">{c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image)} alt="" className="size-full object-cover" />}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-bold">{tr(c.name, "en") || tr(c.name, "fr") || c.slug}</span><span className="text-xs text-muted" dir="ltr">/{c.slug}</span></span>
                    <span className="num text-sm text-muted">{n} product{n === 1 ? "" : "s"}</span>
                    {!c.active && <Badge>Hidden</Badge>}
                    <span className="btn btn-outline btn-sm group-open:bg-sunken">Edit</span>
                  </summary>
                  <div className="space-y-5 border-t border-line p-4">
                    <CategoryForm c={c} />
                    <DeleteCategory id={c.id} name={tr(c.name, "en") || c.slug} count={n} others={cats.filter((o) => o.id !== c.id).map((o) => ({ id: o.id, name: tr(o.name, "en") || o.slug }))} action={deleteCategory} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
