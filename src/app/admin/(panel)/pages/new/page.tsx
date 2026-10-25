import { sql } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { PageHeader } from "@/features/admin/components/ui";
import { PageForm } from "@/features/catalog-admin/components/page-form";

export const metadata = { title: "New page" };

export default async function NewPage() {
  await requireUser();
  const m = await getDb().select({ m: sql<number>`coalesce(max(${schema.pages.position}), -1)` }).from(schema.pages).get();
  return <div><PageHeader title="New page" /><PageForm nextPosition={(m?.m ?? -1) + 1} /></div>;
}
