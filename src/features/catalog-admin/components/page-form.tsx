import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, I18nField, Toggle } from "@/features/admin/components/fields";
import { RichTextField } from "@/features/admin/components/rich-text-field";
import { Panel } from "@/features/admin/components/ui";
import { parseI18n } from "@/lib/i18n-core";
import { savePage } from "../pages-actions";

type Row = { id: string; slug: string; title: string; body: string; published: boolean; position: number };
export function PageForm({ page, nextPosition = 0 }: { page?: Row; nextPosition?: number }) {
  return (
    <AdminForm action={savePage} submitLabel={page ? "Save page" : "Create page"}>
      <input type="hidden" name="id" value={page?.id ?? ""} />
      <Panel title="Content">
        <div className="space-y-5">
          <I18nField label="Title" name="title" value={page ? parseI18n(page.title) : {}} />
          <RichTextField label="Body" name="body" value={page ? parseI18n(page.body) : {}} minHeight="16rem" />
        </div>
      </Panel>
      <Panel title="Settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Slug" htmlFor="slug" hint="Lowercase letters, numbers, hyphens. The page lives at /page/<slug>."><input id="slug" name="slug" required defaultValue={page?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={60} dir="ltr" className="field" /></Field>
          <Field label="Position" htmlFor="position" hint="Lower numbers come first in the footer."><input id="position" name="position" type="number" min={0} max={9999} defaultValue={page?.position ?? nextPosition} className="field num" /></Field>
        </div>
        <div className="mt-4"><Toggle name="published" label="Published" hint="Unpublished pages are hidden from the storefront." defaultChecked={page?.published ?? true} /></div>
      </Panel>
    </AdminForm>
  );
}
