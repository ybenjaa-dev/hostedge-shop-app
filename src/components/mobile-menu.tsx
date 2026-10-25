"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string };

/** Full-screen white menu with large uppercase links. Portaled into the themed wrapper (the blurred sticky header would otherwise contain it). */
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
        <div className="fixed inset-0 z-[80] flex animate-fade flex-col bg-bg px-5 py-4 lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <div className="flex items-center justify-between"><span className="label-s text-muted">{title}</span><button type="button" className="grid size-11 place-items-center" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-7" strokeWidth={1.4} /></button></div>
          <nav aria-label={title} className="mt-8 flex-1 overflow-y-auto">
            <ul>{links.map((l, i) => <li key={l.href}><Link href={l.href} className="display flex items-baseline justify-between border-b border-line py-4 text-[2.4rem]"><span>{l.label}</span><span className="label-s num text-muted">{String(i + 1).padStart(2, "0")}</span></Link></li>)}</ul>
          </nav>
        </div>,
        document.querySelector(".v7") ?? document.body,
      )}
    </>
  );
}
