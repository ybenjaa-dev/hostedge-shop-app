"use client";
import { useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ActionState } from "@/features/admin/run";
import { useToast } from "@/components/toast";
import { useConfirm } from "@/components/confirm";

/** A one-click server action (approve, delete, toggle…) with confirm, pending state and toast feedback. */
export function ActionButton({ action, fields = {}, children, confirm, className = "btn btn-outline btn-sm", title, onDone }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  fields?: Record<string, string>; children: ReactNode; confirm?: string; className?: string; title?: string; onDone?: (s: ActionState) => void;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const ask = useConfirm();
  return (
    <button type="button" className={className} disabled={pending} aria-busy={pending} title={title} aria-label={title}
      onClick={async () => {
        if (confirm && !(await ask(confirm))) return;
        const fd = new FormData();
        for (const [k, v] of Object.entries(fields)) fd.set(k, v);
        start(async () => {
          const r = await action(undefined, fd);
          if (r?.error) toast("error", r.error);
          else toast("success", r?.message ?? "Done");
          onDone?.(r);
        });
      }}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
