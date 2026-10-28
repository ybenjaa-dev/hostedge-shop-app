import type { ReactNode } from "react";

/** Shared look for every error page: big status code, one-line explanation, actions. Themed purely through the existing utility classes. */
export function ErrorView({ code, icon, title, sub, reference, alert, children }: {
  code?: string; icon?: ReactNode; title: string; sub?: string; reference?: string; alert?: boolean; children?: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-lg place-items-center gap-4 px-4 py-16 text-center sm:py-24" role={alert ? "alert" : undefined}>
      {code ? <p className="display text-8xl font-extrabold leading-none text-brand" aria-hidden>{code}</p> : icon}
      <h1 className="display text-2xl font-extrabold sm:text-3xl">{title}</h1>
      {sub && <p className="max-w-md text-muted">{sub}</p>}
      {children}
      {reference && <p className="text-xs text-muted" dir="ltr">{reference}</p>}
    </div>
  );
}
