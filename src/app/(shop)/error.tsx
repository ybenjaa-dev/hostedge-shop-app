"use client";
import { useStore, useT } from "@/features/checkout/store-context";
import { AlertTriangle } from "lucide-react";

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  void useStore;
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-4 px-4 py-24 text-center">
      <AlertTriangle className="size-12 text-danger" />
      <p className="text-xl font-semibold">{t("common.error")}</p>
      <button className="btn btn-primary" onClick={reset}>{t("common.retry")}</button>
    </div>
  );
}
