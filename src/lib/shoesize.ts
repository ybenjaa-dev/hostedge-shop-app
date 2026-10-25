/** Foot length (cm) for a EU shoe size: the Paris point is 2/3 cm per size and the shoe is ~1.5 cm longer than the foot. Non-numeric or out-of-range sizes are skipped. */
export function shoeRows(sizes: string[]): { size: string; cm: string }[] {
  const seen = new Set<number>();
  const out: { n: number; size: string; cm: string }[] = [];
  for (const s of sizes) {
    const n = parseInt(s.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(n) || n < 30 || n > 50 || seen.has(n)) continue;
    seen.add(n);
    out.push({ n, size: String(n), cm: ((Math.round(((n * 2) / 3 - 1.5) * 2)) / 2).toFixed(1) });
  }
  return out.sort((a, b) => a.n - b.n).map(({ size, cm }) => ({ size, cm }));
}

/** 0 = runs small, 1 = true to size, 2 = runs large; null when the text has no fit information. Reads EN/FR/AR. */
export function fitIndex(value: string | undefined | null): 0 | 1 | 2 | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (/small|petit|صغير|ضيق/.test(v)) return 0;
  if (/large|big|grand|واسع|كبير/.test(v)) return 2;
  return 1;
}
