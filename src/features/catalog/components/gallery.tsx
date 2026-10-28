"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { fileUrl } from "@/lib/storage";

/** Large stacked pictures on desktop, native swipe (scroll-snap) with a counter on phones. Click opens a zoomable lightbox. */
export function Gallery({ images, alt, closeLabel }: { images: { key: string; alt: string | null }[]; alt: string; closeLabel: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [idx, setIdx] = useState(0);
  const [lb, setLb] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  if (!images.length) return <div className="nh-img grid aspect-[4/5] place-items-center text-5xl text-muted">▢</div>;

  const onScroll = () => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth + 1) setIdx(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };
  const open = (i: number) => { setLb(i); setZoomed(false); dialog.current?.showModal(); };

  return (
    <div className="relative">
      <div ref={scroller} onScroll={onScroll} className="nh-stack" tabIndex={0} aria-label={alt}>
        {images.map((im, i) => (
          <button key={im.key} type="button" onClick={() => open(i)} className="nh-img block aspect-[4/5] w-full cursor-zoom-in lg:aspect-[5/6]" aria-label={`Zoom ${i + 1}/${images.length}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(im.key, "md")} alt={im.alt || alt} width={800} height={1000} className="absolute inset-0 size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
          </button>
        ))}
      </div>
      {images.length > 1 && <p className="micro num pointer-events-none absolute bottom-3 end-3 bg-bg px-2 py-1 text-ink lg:hidden">{idx + 1} / {images.length}</p>}
      <dialog ref={dialog} className="m-0 size-full max-h-none max-w-none bg-bg/95 p-0 backdrop:bg-black/60" onClose={() => setZoomed(false)} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={closeLabel} className="absolute end-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-ink text-bg hover:bg-brand"><X className="size-5" /></button>
        <div className="grid size-full place-items-center overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl(images[lb]!.key)} alt={alt}
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); setZoomed((z) => !z); }}
            style={{ transformOrigin: origin, transform: zoomed ? "scale(2.2)" : "none", transition: "transform .25s" }}
            className={`max-h-dvh max-w-full object-contain ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          />
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
            <button type="button" aria-label="Previous" className="grid size-11 place-items-center rounded-full bg-ink text-bg" onClick={() => { setZoomed(false); setLb((i) => (i - 1 + images.length) % images.length); }}><ChevronLeft className="rtl:rotate-180" /></button>
            <button type="button" aria-label="Next" className="grid size-11 place-items-center rounded-full bg-ink text-bg" onClick={() => { setZoomed(false); setLb((i) => (i + 1) % images.length); }}><ChevronRight className="rtl:rotate-180" /></button>
          </div>
        )}
      </dialog>
    </div>
  );
}
