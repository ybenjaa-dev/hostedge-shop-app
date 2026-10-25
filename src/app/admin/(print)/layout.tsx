import { requireUser } from "@/lib/auth";

export const metadata = { robots: { index: false } };

/** Bare layout for printable documents (no admin chrome). */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="min-h-dvh bg-white text-black print:p-0">
      <style>{`@media print{.no-print{display:none!important}@page{margin:12mm}.sheet{break-after:page;box-shadow:none!important;border:0!important}}body{background:#fff!important}`}</style>
      {children}
    </div>
  );
}
