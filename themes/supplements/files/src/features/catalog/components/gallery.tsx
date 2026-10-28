"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { fileUrl } from "@/lib/storage";
import { imgProps } from "@/lib/image-sizes";

/** Swipe gallery (CSS scroll-snap — native swipe, no JS cost) + thumbnails + zoomable lightbox. */
export function Gallery({ images, alt, closeLabel }: { images: { key: string; alt: string | null }[]; alt: string; closeLabel: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [idx, setIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  if (!images.length) return <div className="grid aspect-square place-items-center rounded-[2rem] bg-mint text-5xl text-muted">◍</div>;

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
    <div>
      <div className="relative">
        <div ref={scroller} onScroll={onScroll} className="scroll-snap-x flex aspect-square overflow-x-auto rounded-[2rem] border border-line bg-mint" tabIndex={0} aria-label={alt}>
          {images.map((im, i) => (
            <button key={im.key} type="button" onClick={() => { setIdx(i); dialog.current?.showModal(); }} className="relative block size-full cursor-zoom-in" aria-label={`Zoom ${i + 1}/${images.length}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img {...imgProps(im.key, "(min-width: 1024px) 50vw, 100vw")} alt={im.alt || alt} width={800} height={800} className="size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute end-3 top-3 grid size-9 place-items-center rounded-full bg-bg/80 backdrop-blur"><ZoomIn className="size-4" /></span>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Previous" onClick={() => go(idx - 1)} className="absolute start-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-bg/85 shadow backdrop-blur hover:bg-bg md:grid"><ChevronLeft className="size-5 rtl:rotate-180" /></button>
            <button type="button" aria-label="Next" onClick={() => go(idx + 1)} className="absolute end-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-bg/85 shadow backdrop-blur hover:bg-bg md:grid"><ChevronRight className="size-5 rtl:rotate-180" /></button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-secondary" : "w-1.5 bg-secondary/40"}`} />)}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {images.map((im, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={im.key} type="button" onClick={() => go(i)} aria-label={`${i + 1}`} className={`size-16 overflow-hidden rounded-2xl border-2 ${i === idx ? "border-brand" : "border-transparent opacity-70 hover:opacity-100"}`}><img src={fileUrl(im.key, "thumb")} alt="" className="size-full object-cover" loading="lazy" /></button>
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
