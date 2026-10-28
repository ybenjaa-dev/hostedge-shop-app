"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, Search, X } from "lucide-react";

type L = { href: string; label: string };

/** Narrow drawer from the end edge: search field, then thin serif links. Portaled into the themed wrapper (the blurred sticky header would otherwise contain it). */
export function MobileMenu({ links, title, closeLabel, openLabel, searchLabel }: { links: L[]; title: string; closeLabel: string; openLabel: string; searchLabel: string }) {
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
      <button type="button" className="btn btn-ghost btn-sm !px-2 lg:hidden" aria-label={openLabel} aria-expanded={open} onClick={() => setOpen(true)}><Menu className="size-6" strokeWidth={1.4} /></button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label={closeLabel} className="absolute inset-0 animate-fade bg-black/55" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[84vw] max-w-sm animate-fade flex-col bg-bg px-6 py-5">
            <div className="flex items-center justify-between"><span className="caps gold">{title}</span><button type="button" className="grid size-11 place-items-center" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-6" strokeWidth={1.4} /></button></div>
            <form action="/shop" role="search" className="relative mt-5"><Search className="pointer-events-none absolute start-0 top-1/2 size-4 -translate-y-1/2 text-muted" /><input name="q" type="search" placeholder={searchLabel} className="w-full border-0 border-b border-line bg-transparent py-3 ps-7 text-base outline-none focus:border-[var(--champagne)]" /></form>
            <nav aria-label={title} className="mt-6 flex-1 overflow-y-auto"><ul>{links.map((l) => <li key={l.href}><Link href={l.href} className="heading flex items-center gap-3 border-b border-line py-4 text-[1.7rem]"><span aria-hidden className="gold text-xs">◆</span>{l.label}</Link></li>)}</ul></nav>
          </div>
        </div>,
        document.querySelector(".v13") ?? document.body,
      )}
    </>
  );
}
