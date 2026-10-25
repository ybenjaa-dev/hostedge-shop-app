import { notFound } from "next/navigation";
import { getPage } from "@/features/catalog/queries";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPage((await params).slug);
  const { lang } = await getT();
  return p ? { title: tr(p.title, lang) } : {};
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPage((await params).slug);
  if (!p) notFound();
  const { lang } = await getT();
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="display mb-6 text-4xl font-extrabold">{tr(p.title, lang)}</h1>
      <div className="prose-lite text-lg text-muted"><p>{tr(p.body, lang)}</p></div>
    </article>
  );
}
