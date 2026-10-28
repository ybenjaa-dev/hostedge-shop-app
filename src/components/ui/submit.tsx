"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Submit button with pending state; disabled while the action runs (prevents double submit). */
export function SubmitButton({ children, className = "btn btn-primary", pendingText, disabled }: { children: ReactNode; className?: string; pendingText?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending && <span className="spinner" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
