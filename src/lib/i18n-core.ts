/** The three languages the interface ships with. More can be added in Admin → Languages. */
export const LANGS = ["ar", "fr", "en"] as const;
export type Lang = string;

export type LangMeta = { code: string; name: string; native: string; dir: "ltr" | "rtl"; flag: string; custom?: boolean };
const BUILTIN: Record<string, LangMeta> = {
  ar: { code: "ar", name: "Arabic", native: "العربية", dir: "rtl", flag: "MA" },
  fr: { code: "fr", name: "French", native: "Français", dir: "ltr", flag: "FR" },
  en: { code: "en", name: "English", native: "English", dir: "ltr", flag: "GB" },
};
let custom: LangMeta[] = [];
/** Called by the language loader (src/lib/languages.ts) whenever the saved list changes. */
export function setCustomLangs(list: LangMeta[]) { custom = list.filter((l) => !BUILTIN[l.code]); }
export const customLangs = (): LangMeta[] => custom;
export const allLangs = (): Lang[] => [...LANGS, ...custom.map((c) => c.code)];
export const langMeta = (code: string): LangMeta | undefined => BUILTIN[code] ?? custom.find((c) => c.code === code);
export const allLangMetas = (): LangMeta[] => [...LANGS.map((c) => BUILTIN[c]!), ...custom];
export const labelOf = (code: string): string => langMeta(code)?.native ?? code;
export const LANG_LABEL: Record<string, string> = new Proxy({} as Record<string, string>, { get: (_t, k) => (typeof k === "string" ? labelOf(k) : undefined) });
export const isLang = (s: unknown): s is Lang => typeof s === "string" && allLangs().includes(s);
export const dirOf = (l: Lang): "ltr" | "rtl" => langMeta(l)?.dir ?? "ltr";

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
