export const LATIN_FONTS = ["Bricolage Grotesque", "Archivo", "Manrope", "Inter", "Poppins", "DM Sans", "Outfit", "Sora", "Space Grotesk", "Playfair Display", "Lora"] as const;
export const ARABIC_FONTS = ["Cairo", "Tajawal", "Almarai", "IBM Plex Sans Arabic", "Noto Kufi Arabic", "Readex Pro", "El Messiri"] as const;

export function googleFontsUrl(latin: string, arabic: string): string {
  const fam = (n: string) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@400;600;700;800`;
  const names = [...new Set([latin, arabic])].filter((n) => [...LATIN_FONTS, ...ARABIC_FONTS].includes(n as never));
  return `https://fonts.googleapis.com/css2?${names.map(fam).join("&")}&display=swap`;
}
