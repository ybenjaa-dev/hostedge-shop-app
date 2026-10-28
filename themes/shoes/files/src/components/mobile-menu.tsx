"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

/** Full-screen black menu with huge condensed links and a lime slash. Portaled into the themed wrapper. */
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
      <button type="button" className="grid size-11 place-items-center text-white lg:hidden" aria-label={openLabel} aria-expanded={open} onClick={() => setOpen(true)}><Menu className="size-7" strokeWidth={2.4} /></button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex animate-fade flex-col overflow-hidden bg-[#0d0d0d] px-5 py-4 text-white lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <span aria-hidden className="pointer-events-none absolute -end-24 top-0 h-[140%] w-28 rotate-12 bg-[var(--lime)] rtl:-rotate-12" />
          <div className="relative flex items-center justify-between"><span className="tag"><span>{title}</span></span><button type="button" className="grid size-11 place-items-center" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-8" strokeWidth={2.4} /></button></div>
          <nav aria-label={title} className="relative mt-6 flex-1 overflow-y-auto"><ul>{links.map((l, i) => <li key={l.href}><Link href={l.href} className="heading flex items-baseline gap-3 border-b border-white/15 py-3 text-[2.6rem]"><span className="num text-base font-semibold not-italic text-[var(--lime)]">{String(i + 1).padStart(2, "0")}</span>{l.label}</Link></li>)}</ul></nav>
        </div>,
        document.querySelector(".v14") ?? document.body,
      )}
    </>
  );
}
