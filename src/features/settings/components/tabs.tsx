import Link from "next/link";
import type { ReactNode } from "react";

/** Server-rendered tab links — one look for every tab row in the admin (no inner scrollbars; scrolls sideways quietly on phones). */
export function Tabs({ base, param = "tab", current, items, label = "Sections" }: { base: string; param?: string; current: string; items: { id: string; label: ReactNode; href?: string }[]; label?: string }) {
  return (
    <nav className="tabnav no-scrollbar" aria-label={label}>
      {items.map((t) => (
        <Link key={t.id} href={t.href ?? `${base}?${param}=${t.id}`} scroll={false} aria-current={current === t.id ? "page" : undefined}>{t.label}</Link>
      ))}
    </nav>
  );
}
