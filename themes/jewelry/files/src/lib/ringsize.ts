/** Ring-size guide rows for EU sizes (the size number is the finger circumference in mm). Non-numeric or out-of-range values are skipped. */
export function ringRows(sizes: string[]): { size: string; circ: number; diam: string }[] {
  const out: { size: string; circ: number; diam: string }[] = [];
  const seen = new Set<number>();
  for (const s of sizes) {
    const n = parseInt(s.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n) || n < 44 || n > 72 || seen.has(n)) continue;
    seen.add(n);
    out.push({ size: String(n), circ: n, diam: (n / Math.PI).toFixed(1) });
  }
  return out.sort((a, b) => a.circ - b.circ);
}
