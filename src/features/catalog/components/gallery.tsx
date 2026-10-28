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
  if (!images.length) return <div className="lx-spot grid aspect-[4/5] place-items-center text-5xl text-muted lg:h-full lg:aspect-auto">◇</div>;

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
    <div className="lx-spot group/g aspect-[4/5] lg:aspect-auto lg:h-full">
      <div ref={scroller} onScroll={onScroll} className="scroll-snap-x flex size-full overflow-x-auto" tabIndex={0} aria-label={alt}>
        {images.map((im, i) => (
          <button key={im.key} type="button" onClick={() => { setIdx(i); dialog.current?.showModal(); }} className="relative block size-full cursor-zoom-in" aria-label={`Zoom ${i + 1}/${images.length}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(im.key, "md")} alt={im.alt || alt} width={800} height={1000} className="lx-fade-slow size-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
          </button>
        ))}
      </div>
      <span className="pointer-events-none absolute end-5 top-5 text-brand/80"><ZoomIn className="size-4" strokeWidth={1.3} aria-hidden /></span>
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous" onClick={() => go(idx - 1)} className="absolute start-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center text-ink/70 transition hover:text-brand md:grid"><ChevronLeft className="size-6 rtl:rotate-180" strokeWidth={1.2} /></button>
          <button type="button" aria-label="Next" onClick={() => go(idx + 1)} className="absolute end-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center text-ink/70 transition hover:text-brand md:grid"><ChevronRight className="size-6 rtl:rotate-180" strokeWidth={1.2} /></button>
          <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-2">
            {images.map((im, i) => <button key={im.key} type="button" onClick={() => go(i)} aria-label={`${i + 1}`} className="grid h-5 place-items-center px-1"><span className={`block h-px transition-all duration-500 ${i === idx ? "w-10 bg-brand" : "w-5 bg-ink/40"}`} /></button>)}
          </div>
        </>
      )}
      <dialog ref={dialog} className="m-0 size-full max-h-none max-w-none bg-black/95 p-0 backdrop:bg-black" onClose={() => setZoomed(false)} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }}>
        <button type="button" onClick={() => dialog.current?.close()} aria-label={closeLabel} className="absolute end-4 top-4 z-10 grid size-11 place-items-center border border-white/30 text-white hover:border-white"><X /></button>
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
            <button type="button" aria-label="Previous" className="grid size-11 place-items-center border border-white/30 text-white" onClick={() => { setZoomed(false); setIdx((i) => (i - 1 + images.length) % images.length); }}><ChevronLeft className="rtl:rotate-180" /></button>
            <button type="button" aria-label="Next" className="grid size-11 place-items-center border border-white/30 text-white" onClick={() => { setZoomed(false); setIdx((i) => (i + 1) % images.length); }}><ChevronRight className="rtl:rotate-180" /></button>
          </div>
        )}
      </dialog>
    </div>
  );
}
