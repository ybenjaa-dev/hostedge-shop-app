"use client";
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/** Forms inside a drawer call this after a successful save so the sheet closes. */
const DrawerCtx = createContext<(() => void) | null>(null);
export const useDrawerClose = () => useContext(DrawerCtx);

/** Side sheet for editing one row (category, coupon…). The trigger is any button content; the form is passed as children. */
export function Drawer({ trigger, title, sub, children, triggerClassName = "btn btn-outline btn-sm", triggerLabel, wide = false }: { trigger: ReactNode; title: string; sub?: string; children: ReactNode; triggerClassName?: string; triggerLabel?: string; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", key);
    box.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={triggerLabel}>{trigger}</button>
      {open && (
        <div className="fixed inset-0 z-[85] flex justify-end bg-black/45 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div ref={box} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1} className={`flex h-full w-full animate-fade flex-col bg-bg shadow-2xl outline-none ${wide ? "max-w-3xl" : "max-w-xl"} sm:rounded-s-3xl`}>
            <div className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
              <div className="min-w-0"><h2 id={id} className="display truncate text-xl font-extrabold">{title}</h2>{sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}</div>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={() => setOpen(false)}><X className="size-5" /></button>
            </div>
            <DrawerCtx.Provider value={() => setOpen(false)}><div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div></DrawerCtx.Provider>
          </div>
        </div>
      )}
    </>
  );
}
