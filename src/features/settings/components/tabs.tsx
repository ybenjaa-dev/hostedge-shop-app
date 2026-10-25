import Link from "next/link";

/** Server-rendered tab links driven by a search param. */
export function Tabs({ base, param = "tab", current, items }: { base: string; param?: string; current: string; items: { id: string; label: string }[] }) {
  return (
    <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0" aria-label="Sections">
      {items.map((t) => (
        <Link key={t.id} href={`${base}?${param}=${t.id}`} scroll={false} aria-current={current === t.id ? "page" : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-bold transition ${current === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
