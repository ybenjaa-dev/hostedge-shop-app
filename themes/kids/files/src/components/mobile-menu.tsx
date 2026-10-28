"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

type L = { href: string; label: string; icon?: React.ReactNode };
const TINT = ["bg-[#ffe1db]", "bg-[#d7f3ee]", "bg-[#e6e1fb]", "bg-[#fff0bf]", "bg-[#d8e8ff]"];

/** Side panel of big pastel pills with an icon each. Portaled into the themed wrapper (the blurred floating header would otherwise contain it). */
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
          <button type="button" aria-label={closeLabel} className="absolute inset-0 animate-fade bg-[#1e2a4a]/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-[86vw] max-w-sm animate-fade overflow-y-auto rounded-e-[2.5rem] bg-bg p-5">
            <div className="mb-5 flex items-center justify-between"><span className="heading text-2xl">{title}</span><button type="button" className="grid size-11 place-items-center rounded-full bg-sunken" aria-label={closeLabel} onClick={() => setOpen(false)}><X className="size-5" /></button></div>
            <nav aria-label={title}><ul className="space-y-3">{links.map((l, i) => <li key={l.href}><Link href={l.href} className={`soft heading flex items-center gap-3 rounded-full p-2 pe-5 text-lg text-[#1e2a4a] ${TINT[i % TINT.length]}`}><span className="grid size-11 place-items-center rounded-full bg-white">{l.icon}</span>{l.label}</Link></li>)}</ul></nav>
          </div>
        </div>,
        document.querySelector(".v12") ?? document.body,
      )}
    </>
  );
}
