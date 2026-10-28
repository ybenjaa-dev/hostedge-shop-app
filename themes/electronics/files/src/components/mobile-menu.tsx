"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string; icon?: React.ReactNode };

/** Slide-in drawer with an icon per category. Portaled into the themed wrapper (the blurred sticky header would otherwise contain it). */
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
          <button type="button" aria-label={closeLabel} className="absolute inset-0 animate-fade bg-black/60" onClick={() => setOpen(false)} />
          <div className="panel-dark absolute inset-y-0 start-0 flex w-[84vw] max-w-sm animate-fade flex-col p-5">
            <div className="relative flex items-center justify-between"><span className="chip-spec !border-white/20 !bg-white/10 !text-white">{title}</span><button type="button" className="grid size-11 place-items-center rounded-full bg-white/10" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            <nav aria-label={title} className="relative mt-6 flex-1 overflow-y-auto">
              <ul className="space-y-1.5">{links.map((l) => <li key={l.href}><Link href={l.href} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-lg font-semibold active:bg-white/15"><span className="grid size-9 place-items-center rounded-lg bg-white/10 text-accent">{l.icon}</span>{l.label}</Link></li>)}</ul>
            </nav>
          </div>
        </div>,
        document.querySelector(".v8") ?? document.body,
      )}
    </>
  );
}
