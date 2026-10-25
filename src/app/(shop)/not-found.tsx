import Link from "next/link";
import { getT } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-4 px-4 py-24 text-center">
      <p className="display text-8xl font-extrabold text-brand">404</p>
      <p className="text-xl font-semibold">{t("common.notFound")}</p>
      <Link href="/" className="btn btn-primary">{t("common.goHome")}</Link>
    </div>
  );
}
