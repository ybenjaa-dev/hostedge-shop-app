function parse(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
export function luminance(hex: string) {
  const p = parse(hex);
  if (!p) return 0;
  return 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
}
/** WCAG contrast ratio between two #rrggbb colors. */
export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Readable text color (white/near-black) for a background. */
export function onColor(bg: string) {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111827") ? "#ffffff" : "#111827";
}
export const isHex = (s: string) => /^#[0-9a-f]{6}$/i.test(s);

/** The brand colour, darkened (never lightened) just enough to read as 4.5:1 text on white — keeps stores AA-compliant whatever colour the owner picks. */
export function readableOnWhite(hex: string, min = 4.5): string {
  if (!isHex(hex)) return hex;
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let k = 0; k < 40 && contrastRatio(`#${[r, g, b].map((v) => v!.toString(16).padStart(2, "0")).join("")}`, "#ffffff") < min; k++) { r = Math.round(r! * 0.96); g = Math.round(g! * 0.96); b = Math.round(b! * 0.96); }
  return `#${[r, g, b].map((v) => v!.toString(16).padStart(2, "0")).join("")}`;
}
