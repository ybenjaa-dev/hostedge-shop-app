import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { homeFor } from "@/lib/permissions";

export const metadata = { title: "No access", robots: { index: false, follow: false } };

export default async function NoAccess() {
  const u = await requireUser();
  return (
    <div className="card mx-auto mt-10 grid max-w-md place-items-center gap-3 p-8 text-center sm:p-10" role="alert">
      <ShieldOff className="size-10 text-muted" aria-hidden />
      <p className="display text-5xl font-extrabold text-brand" aria-hidden>403</p>
      <h1 className="display text-xl font-extrabold">You don&apos;t have access to this page</h1>
      <p className="text-sm text-muted">Your role ({u.role}) can&apos;t open this area. Ask the store owner if you need it.</p>
      <Link href={homeFor(u.role)} className="btn btn-primary">Go to my page</Link>
    </div>
  );
}
