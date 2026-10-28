"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** <details> popover that closes on route change, outside click, Escape, or when a link/[data-close] inside it is clicked. */
export function NavMenu({ summary, label, summaryClass, className, panelClass, children }: { summary: React.ReactNode; label: string; summaryClass?: string; className?: string; panelClass?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const path = usePathname();
  useEffect(() => { ref.current?.removeAttribute("open"); }, [path]);
  useEffect(() => {
    const away = (e: MouseEvent) => { const d = ref.current; if (d?.open && !d.contains(e.target as Node)) d.open = false; };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && ref.current) ref.current.open = false; };
    document.addEventListener("click", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("click", away); document.removeEventListener("keydown", esc); };
  }, []);
  return (
    <details ref={ref} className={className}>
      <summary aria-label={label} className={summaryClass}>{summary}</summary>
      <div className={panelClass} onClick={(e) => { if ((e.target as HTMLElement).closest("a,[data-close]")) ref.current?.removeAttribute("open"); }}>{children}</div>
    </details>
  );
}
