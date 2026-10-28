"use client";
import { AlertTriangle } from "lucide-react";

/** Error boundary body shared by the admin, studio, login and setup areas (English: the admin has no translations). */
export function AdminErrorBody({ error, reset, home = "/admin", homeLabel = "Back to dashboard" }: { error: Error & { digest?: string }; reset: () => void; home?: string; homeLabel?: string }) {
  return (
    <div className="card mx-auto mt-10 grid max-w-md place-items-center gap-3 p-8 text-center sm:p-10" role="alert">
      <AlertTriangle className="size-10 text-danger" aria-hidden />
      <h1 className="display text-xl font-extrabold">Something went wrong</h1>
      <p className="text-sm text-muted">This page failed to load. Your data is safe.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <a href={home} className="btn btn-outline">{homeLabel}</a>
      </div>
      {error.digest && <p className="text-xs text-muted" dir="ltr">Reference: {error.digest}</p>}
    </div>
  );
}
