"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "../run";
import { SubmitButton } from "@/components/ui/submit";
import { useToast } from "@/components/toast";
import { useDrawerClose } from "./drawer";

/** <form> wired to a server action: toast on success/error, pending state, no double submit. */
export function AdminForm({ action, children, submitLabel = "Save", className = "space-y-5", hideSubmit, onDone, resetOnSuccess, extra }: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: ReactNode; submitLabel?: string; className?: string; hideSubmit?: boolean; onDone?: (s: ActionState) => void; resetOnSuccess?: boolean; extra?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const toast = useToast();
  const closeDrawer = useDrawerClose();
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state || state.ts === last.current) return;
    last.current = state.ts;
    if (state.error) toast("error", state.error);
    else if (state.ok) { toast("success", state.message ?? "Saved"); if (resetOnSuccess) ref.current?.reset(); closeDrawer?.(); }
    onDone?.(state);
  }, [state, toast, onDone, resetOnSuccess, closeDrawer]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {state?.error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">{state.error}</p>}
      {children}
      {!hideSubmit && <div className="flex items-center gap-3"><SubmitButton pendingText="Saving…">{submitLabel}</SubmitButton>{extra}</div>}
    </form>
  );
}
