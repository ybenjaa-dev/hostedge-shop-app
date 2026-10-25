"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { MediaLibrary } from "./media-library";
import type { MediaItem } from "@/lib/media-client";

/** WordPress-style modal: browse everything already uploaded, search it, or upload new pictures — then pick one or several. */
export function MediaPicker({ open, onClose, onPick, multiple = false, title = "Media library" }: { open: boolean; onClose: () => void; onPick: (items: MediaItem[]) => void; multiple?: boolean; title?: string }) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    box.current?.focus();
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-black/55 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}
        className="flex h-[92dvh] w-full max-w-6xl animate-fade flex-col rounded-t-3xl border border-line bg-bg p-4 shadow-2xl outline-none sm:h-[85vh] sm:rounded-3xl sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id={id} className="display text-xl font-extrabold">{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <MediaLibrary mode="picker" multiple={multiple} onCancel={onClose} onConfirm={(items) => { onPick(items); onClose(); }} />
      </div>
    </div>
  );
}
