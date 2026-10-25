import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { PageHeader } from "@/features/admin/components/ui";
import { PageForm } from "@/features/catalog-admin/components/page-form";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const page = await getDb().select().from(schema.pages).where(eq(schema.pages.id, id)).get();
  if (!page) notFound();
  return <div className="max-w-3xl"><PageHeader title="Edit page" sub={`/page/${page.slug}`} /><PageForm page={page} /></div>;
}
