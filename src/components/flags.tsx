import type { Lang } from "@/lib/i18n-core";

/** Soft-rounded, colourful flags (4:3) for the language switcher. Arabic → Morocco, French → France, English → United Kingdom. */
export function Flag({ lang, className = "h-[18px] w-6" }: { lang: Lang; className?: string }) {
  const id = `fl-${lang}`;
  return (
    <svg viewBox="0 0 24 18" className={`shrink-0 ${className}`} aria-hidden focusable="false">
      <defs><clipPath id={id}><rect width="24" height="18" rx="4.5" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {lang === "ar" && (<>
          <rect width="24" height="18" fill="#c1272d" />
          <path d="M12 3.6l1.6 4.9 5.1 0-4.1 3 1.6 4.9L12 13.4l-4.2 3 1.6-4.9-4.1-3 5.1 0z" fill="none" stroke="#006233" strokeWidth="1.15" strokeLinejoin="round" />
        </>)}
        {lang === "fr" && (<>
          <rect width="24" height="18" fill="#fff" />
          <rect width="8" height="18" fill="#2a4fb4" />
          <rect x="16" width="8" height="18" fill="#ee3b3b" />
        </>)}
        {lang === "en" && (<>
          <rect width="24" height="18" fill="#1d3a8a" />
          <path d="M0 0l24 18M24 0L0 18" stroke="#fff" strokeWidth="3.6" />
          <path d="M0 0l24 18M24 0L0 18" stroke="#d6283b" strokeWidth="1.4" />
          <path d="M12 0v18M0 9h24" stroke="#fff" strokeWidth="6" />
          <path d="M12 0v18M0 9h24" stroke="#d6283b" strokeWidth="3.4" />
        </>)}
      </g>
      <rect x=".4" y=".4" width="23.2" height="17.2" rx="4.1" fill="none" stroke="rgb(0 0 0 / .14)" strokeWidth=".8" />
    </svg>
  );
}
