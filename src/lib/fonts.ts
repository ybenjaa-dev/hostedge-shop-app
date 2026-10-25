export const LATIN_FONTS = ["Roboto", "Tajawal", "Cairo", "Cormorant Garamond", "Lora", "Playfair Display", "Manrope", "Inter", "Poppins", "DM Sans", "Outfit"] as const;
export const ARABIC_FONTS = ["Tajawal", "Cairo", "Reem Kufi", "Amiri", "Almarai", "IBM Plex Sans Arabic", "Noto Kufi Arabic", "Readex Pro", "El Messiri"] as const;

/** Weights each family actually serves — requesting an unsupported one makes Google Fonts reject the whole CSS. */
const WEIGHTS: Record<string, string> = {
  Roboto: "400;500;700;900", Tajawal: "400;500;700;800", Amiri: "400;700", "Cormorant Garamond": "500;600;700", "Reem Kufi": "400..700", Lora: "400;600;700",
};
const DEFAULT_WEIGHTS = "400;600;700;800";
const ALL = new Set<string>([...LATIN_FONTS, ...ARABIC_FONTS]);

export function googleFontsUrl(latin: string, arabic: string, extra: string[] = []): string {
  const fam = (n: string) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@${WEIGHTS[n] ?? DEFAULT_WEIGHTS}`;
  const names = [...new Set([latin, arabic, ...extra])].filter((n) => ALL.has(n));
  return `https://fonts.googleapis.com/css2?${names.map(fam).join("&")}&display=swap`;
}
