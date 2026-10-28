"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { fileUrl } from "@/lib/storage";

/** Swipe gallery (CSS scroll-snap — native swipe, no JS cost) + thumbnails + zoomable lightbox. */
export function Gallery({ images, alt, closeLabel }: { images: { key: string; alt: string | null }[]; alt: string; closeLabel: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  if (!images.length) return <div className="cover cover-big mx-auto w-full max-w-sm"><span className="grid size-full place-items-center text-5xl text-muted">❦</span></div>;

  const go = (i: number) => {
    const n = Math.max(0, Math.min(images.length - 1, i));
    scroller.current?.scrollTo({ left: n * scroller.current.clientWidth * (getComputedStyle(scroller.current).direction === "rtl" ? -1 : 1), behavior: "smooth" });
    setIdx(n);
  };
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setIdx(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="relative min-w-0">
        <div className="cover cover-big">
        <div ref={scroller} onScroll={onScroll} className="scroll-snap-x flex size-full overflow-x-auto" tabIndex={0} aria-label={alt}>
          {images.map((im, i) => (
            <button key={im.key} type="button" onClick={() => { setIdx(i); dialog.current?.showModal(); }} className="relative block size-full cursor-zoom-in" aria-label={`Zoom ${i + 1}/${images.length}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(im.key, "md")} alt={im.alt || alt} width={800} height={1200} className="size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
            </button>
          ))}
        </div>
        </div>
        <span className="pointer-events-none absolute end-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-surface/90 shadow"><ZoomIn className="size-4" /></span>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(idx - 1)} className="absolute start-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 shadow hover:bg-surface"><ChevronLeft className="size-5 rtl:rotate-180" /></button>
            <button type="button" aria-label="Next" onClick={() => go(idx + 1)} className="absolute end-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-surface/90 shadow hover:bg-surface"><ChevronRight className="size-5 rtl:rotate-180" /></button>
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
              {images.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-brand" : "w-1.5 bg-white/70"}`} />)}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-5 flex justify-center gap-3">
          {images.map((im, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={im.key} type="button" onClick={() => go(i)} aria-label={`${i + 1}`} className={`h-20 w-14 overflow-hidden rounded-[2px] border-2 shadow-sm ${i === idx ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}><img src={fileUrl(im.key, "thumb")} alt="" className="size-full object-cover" loading="lazy" /></button>
          ))}
        </div>
      )}
      <dialog ref={dialog} className="m-0 size-full max-h-none max-w-none bg-black/95 p-0 backdrop:bg-black" onClose={() => setZoomed(false)} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={closeLabel} className="absolute end-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X /></button>
        <div className="grid size-full place-items-center overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl(images[idx]!.key)} alt={alt}
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); setZoomed((z) => !z); }}
            style={{ transformOrigin: origin, transform: zoomed ? "scale(2.2)" : "none", transition: "transform .25s" }}
            className={`max-h-dvh max-w-full object-contain ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          />
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3">
            <button type="button" aria-label="Previous" className="grid size-11 place-items-center rounded-full bg-white/15 text-white" onClick={() => { setZoomed(false); setIdx((i) => (i - 1 + images.length) % images.length); }}><ChevronLeft className="rtl:rotate-180" /></button>
            <button type="button" aria-label="Next" className="grid size-11 place-items-center rounded-full bg-white/15 text-white" onClick={() => { setZoomed(false); setIdx((i) => (i + 1) % images.length); }}><ChevronRight className="rtl:rotate-180" /></button>
          </div>
        )}
      </dialog>
    </div>
  );
}
