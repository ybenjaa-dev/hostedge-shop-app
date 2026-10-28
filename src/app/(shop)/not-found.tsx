import Link from "next/link";
import { Search } from "lucide-react";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { listCategories, type Category } from "@/features/catalog/queries";
import { ErrorView } from "@/components/error-view";

export const metadata = { title: "404", robots: { index: false, follow: false } };

export default async function NotFound() {
  const { t, lang } = await getT();
  const cats: Category[] = await listCategories().then((c) => c.slice(0, 6)).catch(() => []);
  return (
    <ErrorView code="404" title={t("common.notFound")} sub={t("err.notFoundSub")}>
      <form action="/shop" role="search" className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted" aria-hidden />
        <input name="q" type="search" className="field ps-9" placeholder={t("err.searchPh")} aria-label={t("common.search")} />
      </form>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">{t("common.goHome")}</Link>
        <Link href="/shop" className="btn btn-outline">{t("err.shop")}</Link>
        <Link href="/track" className="btn btn-ghost">{t("err.track")}</Link>
      </div>
      {cats.length > 0 && (
        <nav aria-label={t("err.popular")} className="flex flex-wrap justify-center gap-2 pt-2">
          {cats.map((c) => <Link key={c.id} href={`/category/${c.slug}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2">{tr(c.name, lang)}</Link>)}
        </nav>
      )}
    </ErrorView>
  );
}
