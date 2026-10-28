"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string; icon?: React.ReactNode };

/** Drawer from the end edge with a big round pet icon per category. Portaled into the themed wrapper. */
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
          <button type="button" aria-label={closeLabel} className="absolute inset-0 animate-fade bg-[#2b2118]/55" onClick={() => setOpen(false)} />
          <div className="paws absolute inset-y-0 end-0 flex w-[84vw] max-w-sm animate-fade flex-col rounded-s-[2.5rem] bg-bg px-5 py-5">
            <div className="flex items-center justify-between"><span className="petag text-sm">{title}</span><button type="button" className="grid size-11 place-items-center rounded-full bg-sunken" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            <nav aria-label={title} className="mt-6 flex-1 overflow-y-auto"><ul className="space-y-3">{links.map((l) => <li key={l.href}><Link href={l.href} className="heading flex items-center gap-4 rounded-full bg-surface p-2 pe-5 text-xl shadow-sm active:scale-[.98]"><span className="grid size-12 place-items-center rounded-full bg-brand text-brand-ink">{l.icon}</span>{l.label}</Link></li>)}</ul></nav>
          </div>
        </div>,
        document.querySelector(".v16") ?? document.body,
      )}
    </>
  );
}
