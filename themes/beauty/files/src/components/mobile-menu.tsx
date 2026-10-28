"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

/** Soft slide-in drawer. Portaled into the themed wrapper because the blurred sticky header would otherwise contain the fixed overlay. */
export function MobileMenu({ links, title, closeLabel, openLabel }: { links: L[]; title: string; closeLabel: string; openLabel: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm !px-2 lg:hidden" aria-label={openLabel} aria-expanded={open} onClick={() => setOpen(true)}><Menu className="size-6" strokeWidth={1.5} /></button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-[#2b1219]/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-[86vw] max-w-sm animate-fade flex-col overflow-y-auto bg-bg p-7 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="eyebrow">{title}</span>
              <button type="button" className="grid size-10 place-items-center rounded-full border border-line" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" strokeWidth={1.5} /></button>
            </div>
            <nav aria-label={title} className="mt-8">
              <ul>
                {links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="display block border-b border-line py-4 text-[2rem] hover:text-brand">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>,
        document.querySelector(".v5") ?? document.body,
      )}
    </>
  );
}
