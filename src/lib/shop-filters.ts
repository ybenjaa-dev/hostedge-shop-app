/** URL format for variant-option filters: `opt=Size:M|Size:L|Color:Black`. Pure. */
export function parseOptions(raw: string | string[] | undefined): Record<string, string[]> {
  const s = Array.isArray(raw) ? raw.join("|") : raw ?? "";
  const out: Record<string, string[]> = {};
  for (const part of s.slice(0, 600).split("|")) {
    const i = part.indexOf(":");
    if (i < 1) continue;
    const k = part.slice(0, i).trim().slice(0, 40), v = part.slice(i + 1).trim().slice(0, 60);
    if (!k || !v) continue;
    const list = (out[k] ??= []);
    if (!list.includes(v) && list.length < 12) list.push(v);
  }
  return Object.fromEntries(Object.entries(out).slice(0, 4));
}
export function stringifyOptions(o: Record<string, string[]>): string {
  return Object.entries(o).flatMap(([k, vs]) => vs.map((v) => `${k.replace(/[|:]/g, " ")}:${v.replace(/[|]/g, " ")}`)).join("|");
}
