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
  if (!images.length) return <div className="grid aspect-square place-items-center bg-sunken text-5xl text-muted">▢</div>;

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

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div>
      <div className="tile relative hover:!transform-none">
        <div ref={scroller} onScroll={onScroll} className="scroll-snap-x flex aspect-[4/5] overflow-x-auto bg-sunken sm:aspect-square" tabIndex={0} aria-label={alt}>
          {images.map((im, i) => (
            <button key={im.key} type="button" onClick={() => { setIdx(i); dialog.current?.showModal(); }} className="relative block size-full cursor-zoom-in" aria-label={`Zoom ${i + 1}/${images.length}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl(im.key, "md")} alt={im.alt || alt} width={800} height={800} className="size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
            </button>
          ))}
        </div>
        <span className="display pointer-events-none absolute bottom-3 start-4 text-5xl text-[var(--brand)] drop-shadow"><span className="num">{pad(idx + 1)}</span><span className="text-2xl text-white/60">/{pad(images.length)}</span></span>
        <span className="pointer-events-none absolute end-3 top-5 grid size-9 place-items-center bg-black/60 text-white"><ZoomIn className="size-4" /></span>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(idx - 1)} className="absolute start-0 top-1/2 hidden size-11 -translate-y-1/2 place-items-center bg-black/70 text-white hover:bg-[var(--brand)] hover:text-black md:grid"><ChevronLeft className="size-5 rtl:rotate-180" /></button>
            <button type="button" aria-label="Next" onClick={() => go(idx + 1)} className="absolute end-0 top-1/2 hidden size-11 -translate-y-1/2 place-items-center bg-black/70 text-white hover:bg-[var(--brand)] hover:text-black md:grid"><ChevronRight className="size-5 rtl:rotate-180" /></button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((im, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={im.key} type="button" onClick={() => go(i)} aria-label={`${i + 1}`} className={`size-16 shrink-0 overflow-hidden border-b-4 bg-sunken ${i === idx ? "border-[var(--brand)]" : "border-transparent opacity-60 hover:opacity-100"}`}><img src={fileUrl(im.key, "thumb")} alt="" className="size-full object-cover" loading="lazy" /></button>
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
