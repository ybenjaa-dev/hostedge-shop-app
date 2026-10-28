import Link from "next/link";
import { asc } from "drizzle-orm";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { tr } from "@/lib/i18n-core";
import { Badge, Empty, PageHeader } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { ActionButton } from "@/features/settings/components/action-button";
import { deletePage } from "@/features/catalog-admin/pages-actions";

export const metadata = { title: "Pages" };

export default async function PagesPage() {
  await requirePerm("pages.edit");
  const rows = await getDb().select().from(schema.pages).orderBy(asc(schema.pages.position), asc(schema.pages.slug));
  return (
    <div>
      <PageHeader title="Pages" sub="Static pages such as About, Shipping and Returns." actions={<Link href="/admin/pages/new" className="btn btn-primary btn-sm"><Plus className="size-4" aria-hidden />New page</Link>} />
      {rows.length === 0 ? <Empty title="No pages yet" hint="Create About, Shipping policy or Terms pages for your store." action={<Link href="/admin/pages/new" className="btn btn-primary btn-sm">New page</Link>} /> : (
        <DataTable head={["Title", "Slug", "Status", "Position", ""]}>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td className="font-semibold"><Link href={`/admin/pages/${p.id}`} className="hover:underline">{tr(p.title, "en") || p.slug}</Link></Td>
              <Td className="text-muted" ><code dir="ltr">/page/{p.slug}</code></Td>
              <Td>{p.published ? <Badge color="#16a34a">Published</Badge> : <Badge>Draft</Badge>}</Td>
              <Td className="num">{p.position}</Td>
              <Td><div className="flex justify-end gap-1">
                {p.published && <Link href={`/page/${p.slug}`} target="_blank" className="btn btn-ghost btn-sm" aria-label={`View ${p.slug} on the store`}><ExternalLink className="size-4" /></Link>}
                <Link href={`/admin/pages/${p.id}`} className="btn btn-outline btn-sm"><Pencil className="size-4" aria-hidden />Edit</Link>
                <ActionButton action={deletePage} fields={{ id: p.id }} confirm={`Delete the page “${p.slug}”?`} className="btn btn-ghost btn-sm text-danger">Delete</ActionButton>
              </div></Td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
