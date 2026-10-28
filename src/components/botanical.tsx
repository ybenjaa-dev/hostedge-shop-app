/** Hand-drawn style SVG decorations used across the storefront. All take currentColor strokes so they follow the theme. */
type P = { className?: string };

export function LeafMark({ className = "size-9" }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="5" y="5" width="54" height="54" rx="20" fill="#ffc83d" stroke="#1f3d2b" strokeWidth="4" />
      <path d="M32 50V30" stroke="#1f3d2b" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 32C18 32 14 22 16 14C26 14 33 20 32 32Z" fill="#4fa86b" stroke="#1f3d2b" strokeWidth="4" strokeLinejoin="round" />
      <path d="M32 38C44 38 49 30 48 22C39 22 32 27 32 38Z" fill="#9bd36a" stroke="#1f3d2b" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

export function Sprig({ className = "w-24" }: P) {
  return (
    <svg viewBox="0 0 120 160" className={className} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M60 156C58 120 62 80 66 12" />
      <path d="M61 130C36 126 22 110 20 88C42 90 58 106 61 130Z" />
      <path d="M62 104C86 100 100 84 102 62C80 64 65 80 62 104Z" />
      <path d="M63 76C44 70 34 56 34 38C52 40 62 54 63 76Z" />
      <path d="M65 52C82 46 90 34 90 18C74 20 66 34 65 52Z" />
    </svg>
  );
}

export function Monstera({ className = "w-28" }: P) {
  return (
    <svg viewBox="0 0 140 150" className={className} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M70 146C68 120 72 100 70 82" />
      <path d="M70 82C20 90 6 44 30 18C44 6 62 10 70 26C78 10 98 6 112 20C136 46 118 92 70 82Z" />
      <path d="M70 82C70 60 70 44 70 26M70 70C52 66 40 54 34 40M70 70C88 66 100 54 106 40M70 52C58 50 50 42 46 32M70 52C82 50 90 42 94 32" />
    </svg>
  );
}

export function Squiggle({ className = "w-full" }: P) {
  return (
    <svg viewBox="0 0 200 14" className={className} preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" aria-hidden>
      <path d="M3 8C20 0 30 14 50 7S80 1 100 8s30 5 50-1 35-2 47 2" />
    </svg>
  );
}

export function Wave({ className = "w-full" }: P) {
  return (
    <svg viewBox="0 0 1200 60" className={className} preserveAspectRatio="none" aria-hidden>
      <path d="M0 60V28C60 4 120 4 180 28S300 52 360 28 480 4 540 28 660 52 720 28 840 4 900 28 1020 52 1080 28 1140 4 1200 22V60Z" fill="currentColor" />
    </svg>
  );
}

export function Dots({ className = "w-16" }: P) {
  return (
    <svg viewBox="0 0 60 60" className={className} fill="currentColor" aria-hidden>
      {[8, 30, 52].flatMap((x) => [8, 30, 52].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" />))}
    </svg>
  );
}

export function Sparkle({ className = "size-8", fill = "#ffc83d" }: P & { fill?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 3Q20 20 37 20Q20 20 20 37Q20 20 3 20Q20 20 20 3Z" fill={fill} stroke="#1f3d2b" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
