/** Look & feel options beyond colours and fonts. Stored apart from the main settings so every theme can use them. Pure — shared by the storefront and the studio preview. */
export const ROUNDNESS = ["theme", "sharp", "soft", "round"] as const;
export const TEXT_SIZE = ["theme", "small", "large"] as const;
export const WIDTH = ["theme", "narrow", "wide"] as const;
export const BACKGROUND = ["theme", "white", "warm", "cool", "custom"] as const;
export const CASE = ["theme", "normal", "upper"] as const;

export type Extra = {
  roundness: (typeof ROUNDNESS)[number]; textSize: (typeof TEXT_SIZE)[number]; width: (typeof WIDTH)[number];
  background: (typeof BACKGROUND)[number]; bgCustom: string; headingCase: (typeof CASE)[number]; buttonCase: (typeof CASE)[number];
};
export const DEFAULT_EXTRA: Extra = { roundness: "theme", textSize: "theme", width: "theme", background: "theme", bgCustom: "#fbfaf7", headingCase: "theme", buttonCase: "theme" };

const pick = <T extends readonly string[]>(list: T, v: unknown, d: T[number]): T[number] => (typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : d);
export function parseExtra(raw: unknown): Extra {
  let o: Record<string, unknown> = {};
  if (typeof raw === "string") { try { o = JSON.parse(raw) as Record<string, unknown>; } catch { /* defaults */ } } else if (raw && typeof raw === "object") o = raw as Record<string, unknown>;
  return {
    roundness: pick(ROUNDNESS, o.roundness, "theme"), textSize: pick(TEXT_SIZE, o.textSize, "theme"), width: pick(WIDTH, o.width, "theme"),
    background: pick(BACKGROUND, o.background, "theme"), bgCustom: typeof o.bgCustom === "string" && /^#[0-9a-fA-F]{6}$/.test(o.bgCustom) ? o.bgCustom : DEFAULT_EXTRA.bgCustom,
    headingCase: pick(CASE, o.headingCase, "theme"), buttonCase: pick(CASE, o.buttonCase, "theme"),
  };
}

const RADII: Record<string, string> = {
  sharp: "--radius-md:.125rem;--radius-lg:.2rem;--radius-xl:.25rem;--radius-2xl:.3rem;--radius-3xl:.4rem",
  soft: "--radius-md:.375rem;--radius-lg:.5rem;--radius-xl:.75rem;--radius-2xl:1rem;--radius-3xl:1.25rem",
  round: "--radius-md:.6rem;--radius-lg:.9rem;--radius-xl:1.25rem;--radius-2xl:1.75rem;--radius-3xl:2.25rem",
};
const BG: Record<string, string> = { white: "#ffffff", warm: "#fbf7f0", cool: "#f4f7fb" };

/** CSS for the chosen options. `scope` is `:root:root` on the storefront and the preview wrapper in the studio. */
export function extraCss(e: Extra, scope = ":root:root"): string {
  const vars: string[] = [];
  if (e.roundness !== "theme") vars.push(RADII[e.roundness]!);
  if (e.width !== "theme") vars.push(`--container-7xl:${e.width === "narrow" ? "70rem" : "92rem"}`);
  const bg = e.background === "custom" ? e.bgCustom : BG[e.background];
  const out: string[] = [];
  if (vars.length) out.push(`${scope}{${vars.join(";")}}`);
  if (bg) out.push(`${scope}:not([data-theme="dark"]){--bg:${bg}${e.background === "white" ? ";--sunken:#f5f5f4" : ""}}`);
  if (e.textSize !== "theme" && scope === ":root:root") out.push(`html{font-size:${e.textSize === "small" ? "93.75%" : "106.25%"}}`);
  const pre = scope === ":root:root" ? "" : `${scope} `;
  if (e.headingCase !== "theme") out.push(`${pre}.display{text-transform:${e.headingCase === "upper" ? "uppercase" : "none"}${e.headingCase === "upper" ? ";letter-spacing:.02em" : ""}}`);
  if (e.buttonCase !== "theme") out.push(`${pre}.btn{text-transform:${e.buttonCase === "upper" ? "uppercase" : "none"}${e.buttonCase === "upper" ? ";letter-spacing:.04em" : ""}}`);
  return out.join("");
}
