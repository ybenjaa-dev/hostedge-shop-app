import Link from "next/link";
import { SearchX } from "lucide-react";

export function AdminNotFoundBody({ back = "/admin", label = "Back to dashboard" }: { back?: string; label?: string }) {
  return (
    <div className="card mx-auto mt-10 grid max-w-md place-items-center gap-3 p-8 text-center sm:p-10">
      <SearchX className="size-10 text-muted" aria-hidden />
      <p className="display text-5xl font-extrabold text-brand" aria-hidden>404</p>
      <h1 className="display text-xl font-extrabold">Page not found</h1>
      <p className="text-sm text-muted">This page doesn&apos;t exist, or the item was deleted.</p>
      <Link href={back} className="btn btn-primary">{label}</Link>
    </div>
  );
}
