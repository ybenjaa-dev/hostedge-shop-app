import Link from "next/link";
import { getT } from "@/lib/i18n";
import { ErrorView } from "@/components/error-view";

export const metadata = { title: "404", robots: { index: false, follow: false } };

/** Unmatched URLs outside the storefront group (no shop header here, so keep it self-contained). */
export default async function RootNotFound() {
  const { t } = await getT();
  return (
    <main id="main">
      <ErrorView code="404" title={t("common.notFound")} sub={t("err.notFoundSub")}>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-primary">{t("common.goHome")}</Link>
          <Link href="/shop" className="btn btn-outline">{t("err.shop")}</Link>
        </div>
      </ErrorView>
    </main>
  );
}
