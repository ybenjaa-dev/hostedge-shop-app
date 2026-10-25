"use client";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 grid max-w-md place-items-center gap-3 p-10 text-center" role="alert">
      <AlertTriangle className="size-10 text-danger" />
      <h1 className="display text-xl font-extrabold">Something went wrong</h1>
      <p className="text-sm text-muted">This page failed to load. Your data is safe.{error.digest ? ` (ref ${error.digest})` : ""}</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  );
}
