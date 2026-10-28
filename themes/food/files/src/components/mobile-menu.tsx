"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

/** Top sheet with chunky sticker links. Portaled into the themed wrapper. */
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
      <button type="button" className="btn btn-ghost btn-sm !px-2 lg:hidden" aria-label={openLabel} aria-expanded={open} onClick={() => setOpen(true)}><Menu className="size-6" strokeWidth={2.5} /></button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <button type="button" aria-label={closeLabel} className="absolute inset-0 animate-fade bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-0 max-h-[90dvh] animate-fade overflow-y-auto border-b-2 border-ink bg-bg p-4 pb-6">
            <div className="mb-4 flex items-center justify-between"><span className="heading text-2xl">{title}</span><button type="button" className="btn btn-outline btn-sm !px-2" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" strokeWidth={2.5} /></button></div>
            <nav aria-label={title}><ul className="space-y-2.5">{links.map((l, i) => <li key={l.href}><Link href={l.href} className={`sticker heading flex items-center justify-between px-4 py-3.5 text-xl ${i % 3 === 0 ? "!bg-[var(--mustard)] !text-[#1f2a1c]" : ""}`}>{l.label}<span aria-hidden>→</span></Link></li>)}</ul></nav>
          </div>
        </div>,
        document.querySelector(".v11") ?? document.body,
      )}
    </>
  );
}
