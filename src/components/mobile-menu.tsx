"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

/** Full-screen plum menu with large serif links. Portaled into the themed wrapper (the blurred sticky header would otherwise contain it). */
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
        <div className="panel-plum fixed inset-0 z-[80] flex animate-fade flex-col px-6 py-5 lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <div className="relative flex items-center justify-between"><span className="eyebrow">{title}</span><button type="button" className="grid size-11 place-items-center rounded-full border border-white/25" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" /></button></div>
          <nav aria-label={title} className="relative mt-8 flex-1 overflow-y-auto">
            <ul className="text-center">{links.map((l) => <li key={l.href}><Link href={l.href} className="heading block border-b border-white/10 py-4 text-[2rem] italic">{l.label}</Link></li>)}</ul>
          </nav>
        </div>,
        document.querySelector(".v9") ?? document.body,
      )}
    </>
  );
}
