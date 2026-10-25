export const LATIN_FONTS = ["Inter", "DM Sans", "Manrope", "Outfit", "Poppins", "Sora", "Syne", "Space Grotesk", "Jost", "Archivo", "Oswald", "Fredoka", "Baloo 2", "Fraunces", "Playfair Display", "Bodoni Moda", "Marcellus", "Cormorant Garamond", "Lora", "Tajawal", "Cairo"] as const;
export const ARABIC_FONTS = ["Tajawal", "Cairo", "Almarai", "IBM Plex Sans Arabic", "Noto Kufi Arabic", "Readex Pro", "El Messiri", "Amiri", "Reem Kufi"] as const;

/** Axis spec each family is requested with — an unsupported weight/axis makes Google Fonts reject the whole CSS. */
const AXES: Record<string, string> = {
  Tajawal: "wght@400;500;700;800", Amiri: "wght@400;700", Lora: "wght@400;600;700", Marcellus: "wght@400",
  "Playfair Display": "ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600",
  "Cormorant Garamond": "ital,wght@0,500;0,600;0,700;1,500;1,600",
  "DM Sans": "wght@400;500;600;700", "Space Grotesk": "wght@400;500;600;700", Sora: "wght@400;600;700;800", Syne: "wght@400;500;600;700;800",
  Jost: "wght@400;500;600;700", Oswald: "wght@400;500;600;700", Fredoka: "wght@400;500;600;700", "Baloo 2": "wght@400;500;600;700;800",
  Fraunces: "wght@400;500;600;700", "Bodoni Moda": "wght@400;500;600;700", "Reem Kufi": "wght@400..700", Inter: "wght@400;500;600;700;800", Outfit: "wght@500;600;700;800",
};
const DEFAULT_AXES = "wght@400;600;700;800";
const ALL = new Set<string>([...LATIN_FONTS, ...ARABIC_FONTS]);

export function googleFontsUrl(latin: string, arabic: string, extra: string[] = []): string {
  const fam = (n: string) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:${AXES[n] ?? DEFAULT_AXES}`;
  const names = [...new Set([latin, arabic, ...extra])].filter((n) => ALL.has(n));
  return `https://fonts.googleapis.com/css2?${names.map(fam).join("&")}&display=swap`;
}
