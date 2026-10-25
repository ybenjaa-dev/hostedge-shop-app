"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Submit button with pending state; disabled while the action runs (prevents double submit). */
export function SubmitButton({ children, className = "btn btn-primary", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && <span className="spinner" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
