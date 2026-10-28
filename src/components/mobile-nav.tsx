"use client";
import { useRef } from "react";
import { Menu, X } from "lucide-react";

/** Slide-in drawer for phones/tablets. Server-rendered nav comes in as children; any link click closes it. */
export function MobileNav({ children, label, closeLabel }: { children: React.ReactNode; label: string; closeLabel: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" aria-label={label} className="btn btn-ghost btn-sm -ms-2 !px-2" onClick={() => ref.current?.showModal()}><Menu className="size-5" strokeWidth={1.5} /></button>
      <dialog ref={ref} aria-label={label}
        className="m-0 me-auto h-dvh max-h-none w-[min(88vw,22rem)] max-w-none overflow-y-auto bg-bg p-0 text-ink backdrop:bg-black/40 open:animate-fade"
        onClick={(e) => { if (e.target === ref.current || (e.target as HTMLElement).closest("a")) ref.current?.close(); }}>
        <div className="flex min-h-full flex-col px-7 pb-8 pt-6">
          <button type="button" aria-label={closeLabel} className="btn btn-ghost btn-sm -ms-2 mb-6 w-fit !px-2" onClick={() => ref.current?.close()}><X className="size-5" strokeWidth={1.5} /></button>
          {children}
        </div>
      </dialog>
    </>
  );
}
