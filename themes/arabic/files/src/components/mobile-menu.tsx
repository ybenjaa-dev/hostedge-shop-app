"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

/** Slide-in drawer from the reading-start side (right in Arabic, left in French/English). Closes on route change, Esc and backdrop tap. */
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
      <button type="button" className="btn btn-ghost btn-sm !px-2 lg:hidden" aria-label={openLabel} aria-expanded={open} onClick={() => setOpen(true)}><Menu className="size-6" /></button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-[#0b1226]/60 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="bg-zel-w absolute inset-y-0 start-0 flex w-[84vw] max-w-sm animate-fade flex-col overflow-y-auto bg-navy p-6 text-[#f6efd9] shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="heading text-2xl text-[#e3c36f]">{title}</span>
              <button type="button" className="grid size-10 place-items-center rounded-full border border-gold/70 text-[#e3c36f]" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" /></button>
            </div>
            <div className="rule my-5 text-[#c9a24b]"><span className="orn" /></div>
            <nav aria-label={title}>
              <ul className="space-y-1">
                {links.map((l) => (
                  <li key={l.href}><Link href={l.href} className="heading flex items-center gap-3 rounded-lg px-3 py-3 text-2xl hover:bg-white/10"><span className="orn !size-3" aria-hidden />{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>,
        // the sticky/blurred header would otherwise become the containing block of this fixed overlay
        document.querySelector(".v3") ?? document.body,
      )}
    </>
  );
}
