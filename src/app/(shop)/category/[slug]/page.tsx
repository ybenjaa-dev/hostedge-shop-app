import { notFound } from "next/navigation";
import { listCategories } from "@/features/catalog/queries";
import { Catalog } from "../../shop/page";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const cats = await listCategories();
  if (!cats.some((c) => c.slug === slug)) notFound();
  return <Catalog sp={await searchParams} categorySlug={slug} />;
}
