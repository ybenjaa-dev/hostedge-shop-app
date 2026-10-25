export const LATIN_FONTS = ["DM Sans", "Manrope", "Tajawal", "Cairo", "Playfair Display", "Cormorant Garamond", "Lora", "Inter", "Poppins", "Outfit"] as const;
export const ARABIC_FONTS = ["Tajawal", "Cairo", "Amiri", "Almarai", "IBM Plex Sans Arabic", "Noto Kufi Arabic", "Readex Pro", "El Messiri"] as const;

/** Axis spec each family is requested with — an unsupported weight/axis makes Google Fonts reject the whole CSS. */
const AXES: Record<string, string> = {
  Tajawal: "wght@400;500;700;800", Amiri: "wght@400;700", Lora: "wght@400;600;700",
  "Playfair Display": "ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600",
  "Cormorant Garamond": "ital,wght@0,500;0,600;0,700;1,500;1,600",
  "DM Sans": "wght@400;500;600;700",
};
const DEFAULT_AXES = "wght@400;600;700;800";
const ALL = new Set<string>([...LATIN_FONTS, ...ARABIC_FONTS]);

export function googleFontsUrl(latin: string, arabic: string, extra: string[] = []): string {
  const fam = (n: string) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:${AXES[n] ?? DEFAULT_AXES}`;
  const names = [...new Set([latin, arabic, ...extra])].filter((n) => ALL.has(n));
  return `https://fonts.googleapis.com/css2?${names.map(fam).join("&")}&display=swap`;
}
