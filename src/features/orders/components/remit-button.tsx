"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRemittedAction } from "../admin-actions";
import { useToast } from "@/components/toast";

export function RemitButton({ ids, remitted, label }: { ids: string[]; remitted: boolean; label: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button className="btn btn-outline btn-sm" disabled={pending || !ids.length} onClick={() => start(async () => { const r = await markRemittedAction(ids, remitted); toast(r?.ok ? "success" : "error", r?.message ?? r?.error ?? "Failed"); router.refresh(); })}>
      {pending && <span className="spinner" />}{label}
    </button>
  );
}
