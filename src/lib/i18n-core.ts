export const LANGS = ["ar", "fr", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { ar: "العربية", fr: "Français", en: "English" };
export const isLang = (s: unknown): s is Lang => typeof s === "string" && (LANGS as readonly string[]).includes(s);
export const dirOf = (l: Lang) => (l === "ar" ? "rtl" : "ltr");

export type I18n = Partial<Record<Lang, string>>;

/** Pick a localized value from a JSON-encoded or object translation map with fallback chain. */
export function tr(value: string | I18n | null | undefined, lang: Lang, fallbackLang: Lang = "en"): string {
  if (!value) return "";
  let m: I18n;
  if (typeof value === "string") {
    if (!value.startsWith("{")) return value;
    try {
      m = JSON.parse(value) as I18n;
    } catch {
      return value;
    }
  } else m = value;
  return m[lang] || m[fallbackLang] || m.en || m.fr || m.ar || Object.values(m).find(Boolean) || "";
}

export const parseI18n = (v: string | null | undefined): I18n => {
  if (!v) return {};
  try {
    const o = JSON.parse(v);
    return o && typeof o === "object" ? (o as I18n) : {};
  } catch {
    return { en: v };
  }
};
