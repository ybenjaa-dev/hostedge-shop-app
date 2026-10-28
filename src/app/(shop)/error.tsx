"use client";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useT } from "@/features/checkout/store-context";
import { ErrorView } from "@/components/error-view";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <ErrorView alert icon={<AlertTriangle className="size-14 text-danger" aria-hidden />} title={t("common.error")} sub={t("err.errorSub")} reference={error.digest ? t("err.ref", { ref: error.digest }) : undefined}>
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn btn-primary" onClick={reset}>{t("common.retry")}</button>
        <Link href="/" className="btn btn-outline">{t("common.goHome")}</Link>
      </div>
    </ErrorView>
  );
}
