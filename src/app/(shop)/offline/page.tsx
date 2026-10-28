import { WifiOff } from "lucide-react";
import { getT } from "@/lib/i18n";

export const metadata = { title: "Offline", robots: { index: false } };

/** Cached by the service worker; shown when a page can't be loaded without a connection. */
export default async function OfflinePage() {
  const { t } = await getT();
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-3 px-4 py-24 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-sunken text-muted"><WifiOff className="size-9" aria-hidden /></span>
      <h1 className="display text-2xl font-extrabold">{t("pwa.offline.title")}</h1>
      <p className="text-muted">{t("pwa.offline.sub")}</p>
      <a href="/" className="btn btn-primary">{t("pwa.offline.retry")}</a>
    </div>
  );
}
