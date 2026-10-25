import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="display text-2xl font-extrabold sm:text-3xl">{title}</h1>{sub && <p className="mt-1 text-sm text-muted">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
export function Panel({ title, children, className = "", actions, id }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode; id?: string }) {
  return (
    <section id={id} className={`card scroll-mt-40 p-5 ${className}`}>
      {(title || actions) && <div className="mb-4 flex items-center justify-between gap-2">{title && <h2 className="display text-lg font-extrabold">{title}</h2>}{actions}</div>}
      {children}
    </section>
  );
}
export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-line p-12 text-center"><p className="font-bold">{title}</p>{hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}{action}</div>;
}
export function Badge({ children, color = "#64748b" }: { children: ReactNode; color?: string }) {
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}><span className="size-1.5 rounded-full" style={{ background: color }} />{children}</span>;
}
export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "ok" | "danger" }) {
  return <div className="card p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p><p className={`display num mt-1 text-2xl font-extrabold ${tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : ""}`}>{value}</p>{sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}</div>;
}
export function Pager({ page, pages, base, params }: { page: number; pages: number; base: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const href = (p: number) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ ...params, page: String(p) })) if (v) u.set(k, v); return `${base}?${u}`; };
  return (
    <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
      <Link aria-disabled={page <= 1} href={href(page - 1)} className={`btn btn-outline btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>Previous</Link>
      <span className="num text-muted">Page {page} / {pages}</span>
      <Link aria-disabled={page >= pages} href={href(page + 1)} className={`btn btn-outline btn-sm ${page >= pages ? "pointer-events-none opacity-40" : ""}`}>Next</Link>
    </nav>
  );
}

/** Every list page's filters: one card, fields wrap and shrink inside it, the buttons never leave it. */
export function FilterBar({ children, actions, hidden }: { children: ReactNode; actions?: ReactNode; hidden?: Record<string, string | undefined> }) {
  return (
    <form method="get" role="search" className="filter-bar">
      {Object.entries(hidden ?? {}).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
      {children}
      <div className="fb-actions">{actions ?? <button className="btn btn-primary">Filter</button>}</div>
    </form>
  );
}
/** A labelled slot inside a FilterBar. `grow` makes it the wide one (search). */
export function FbItem({ label, grow, wide, children }: { label?: string; grow?: boolean; wide?: boolean; children: ReactNode }) {
  return <div className={grow ? "fb-grow" : "fb-item"} style={wide ? { flexBasis: "17rem" } : undefined}>{label && <span className="label">{label}</span>}{children}</div>;
}
