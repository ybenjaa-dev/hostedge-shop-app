/** Accent-, case- and Arabic-letter-variant-insensitive text for search ("poêle" = "poele", "أحمر" = "احمر"). Pure. */
export function fold(input: string): string {
  return (input ?? "")
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")      // Latin accents, Arabic diacritics, tatweel
    .replace(/[أإآٱ]/g, "ا")                // أ إ آ ٱ → ا
    .replace(/ى/g, "ي").replace(/ة/g, "ه")       // ى → ي, ة → ه
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)) // Arabic-Indic digits
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Search words: folded, unique, at most 6, each at least 1 char (2+ for Latin to avoid matching everything). */
export function tokens(q: string): string[] {
  const out: string[] = [];
  for (const t of fold(q).split(" ")) if (t && (t.length >= 2 || /[^\u0000-ɏ]/.test(t)) && !out.includes(t)) out.push(t);
  return out.slice(0, 6);
}

/** Escape for a LIKE ... ESCAPE '\' pattern. */
export const likeEsc = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);
