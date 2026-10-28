import type { LangMeta } from "./i18n-core";

/** Languages the owner can add with one click. `flag` is the ISO country code shown next to the name. */
export const LANG_PRESETS: Omit<LangMeta, "custom">[] = [
  { code: "es", name: "Spanish", native: "Español", dir: "ltr", flag: "ES" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr", flag: "DE" },
  { code: "it", name: "Italian", native: "Italiano", dir: "ltr", flag: "IT" },
  { code: "pt", name: "Portuguese", native: "Português", dir: "ltr", flag: "PT" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr", flag: "NL" },
  { code: "tr", name: "Turkish", native: "Türkçe", dir: "ltr", flag: "TR" },
  { code: "ru", name: "Russian", native: "Русский", dir: "ltr", flag: "RU" },
  { code: "uk", name: "Ukrainian", native: "Українська", dir: "ltr", flag: "UA" },
  { code: "pl", name: "Polish", native: "Polski", dir: "ltr", flag: "PL" },
  { code: "ro", name: "Romanian", native: "Română", dir: "ltr", flag: "RO" },
  { code: "el", name: "Greek", native: "Ελληνικά", dir: "ltr", flag: "GR" },
  { code: "sv", name: "Swedish", native: "Svenska", dir: "ltr", flag: "SE" },
  { code: "cs", name: "Czech", native: "Čeština", dir: "ltr", flag: "CZ" },
  { code: "sq", name: "Albanian", native: "Shqip", dir: "ltr", flag: "AL" },
  { code: "zh", name: "Chinese", native: "中文", dir: "ltr", flag: "CN" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr", flag: "JP" },
  { code: "ko", name: "Korean", native: "한국어", dir: "ltr", flag: "KR" },
  { code: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr", flag: "IN" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", dir: "ltr", flag: "ID" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", dir: "ltr", flag: "VN" },
  { code: "th", name: "Thai", native: "ไทย", dir: "ltr", flag: "TH" },
  { code: "ur", name: "Urdu", native: "اردو", dir: "rtl", flag: "PK" },
  { code: "fa", name: "Persian", native: "فارسی", dir: "rtl", flag: "IR" },
  { code: "he", name: "Hebrew", native: "עברית", dir: "rtl", flag: "IL" },
  { code: "ku", name: "Kurdish", native: "کوردی", dir: "rtl", flag: "IQ" },
];

export const flagEmoji = (cc: string): string => (/^[A-Za-z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "🌐");
