export type CurrencyCode = string;

/** ISO-4217 minor-unit exponents for supported currencies. Money is always stored as integer minor units. */
export const CURRENCIES: Record<string, { decimals: number; symbol: { en: string; fr: string; ar: string }; name: string }> = {
  MAD: { decimals: 2, symbol: { en: "MAD", fr: "MAD", ar: "د.م." }, name: "Moroccan Dirham" },
  SAR: { decimals: 2, symbol: { en: "SAR", fr: "SAR", ar: "ر.س" }, name: "Saudi Riyal" },
  AED: { decimals: 2, symbol: { en: "AED", fr: "AED", ar: "د.إ" }, name: "UAE Dirham" },
  KWD: { decimals: 3, symbol: { en: "KWD", fr: "KWD", ar: "د.ك" }, name: "Kuwaiti Dinar" },
  QAR: { decimals: 2, symbol: { en: "QAR", fr: "QAR", ar: "ر.ق" }, name: "Qatari Riyal" },
  BHD: { decimals: 3, symbol: { en: "BHD", fr: "BHD", ar: "د.ب" }, name: "Bahraini Dinar" },
  OMR: { decimals: 3, symbol: { en: "OMR", fr: "OMR", ar: "ر.ع" }, name: "Omani Rial" },
  EUR: { decimals: 2, symbol: { en: "€", fr: "€", ar: "€" }, name: "Euro" },
  USD: { decimals: 2, symbol: { en: "$", fr: "$", ar: "$" }, name: "US Dollar" },
  DZD: { decimals: 2, symbol: { en: "DZD", fr: "DA", ar: "د.ج" }, name: "Algerian Dinar" },
  TND: { decimals: 3, symbol: { en: "TND", fr: "DT", ar: "د.ت" }, name: "Tunisian Dinar" },
  EGP: { decimals: 2, symbol: { en: "EGP", fr: "EGP", ar: "ج.م" }, name: "Egyptian Pound" },
  XOF: { decimals: 0, symbol: { en: "F CFA", fr: "F CFA", ar: "فرنك" }, name: "CFA Franc (West)" },
  XAF: { decimals: 0, symbol: { en: "F CFA", fr: "F CFA", ar: "فرنك" }, name: "CFA Franc (Central)" },
  NGN: { decimals: 2, symbol: { en: "₦", fr: "₦", ar: "₦" }, name: "Nigerian Naira" },
  GHS: { decimals: 2, symbol: { en: "GH₵", fr: "GH₵", ar: "GH₵" }, name: "Ghanaian Cedi" },
  KES: { decimals: 2, symbol: { en: "KSh", fr: "KSh", ar: "KSh" }, name: "Kenyan Shilling" },
  ZAR: { decimals: 2, symbol: { en: "R", fr: "R", ar: "R" }, name: "South African Rand" },
};

export function decimalsOf(currency: CurrencyCode): number {
  return CURRENCIES[currency]?.decimals ?? 2;
}

/** Parse a user-entered major-unit string ("12.5") to minor units without floating point. */
export function toMinor(input: string | number, currency: CurrencyCode): number {
  const d = decimalsOf(currency);
  const s = String(input).trim().replace(/,/g, ".");
  if (!/^-?\d*\.?\d*$/.test(s) || s === "" || s === "." || s === "-") return NaN;
  const neg = s.startsWith("-");
  const [whole = "0", frac = ""] = s.replace("-", "").split(".");
  const fracPadded = (frac + "0".repeat(d)).slice(0, d);
  const minor = parseInt(whole || "0", 10) * 10 ** d + (fracPadded ? parseInt(fracPadded, 10) : 0);
  return neg ? -minor : minor;
}

/** Minor units → plain decimal string for inputs ("12.50"). */
export function toMajorString(minor: number, currency: CurrencyCode): string {
  const d = decimalsOf(currency);
  const neg = minor < 0;
  const abs = Math.abs(Math.trunc(minor));
  if (d === 0) return `${neg ? "-" : ""}${abs}`;
  const whole = Math.floor(abs / 10 ** d);
  const frac = String(abs % 10 ** d).padStart(d, "0");
  return `${neg ? "-" : ""}${whole}.${frac}`;
}

const localeFor = (lang: string) => (lang === "ar" ? "ar-MA-u-nu-latn" : lang === "fr" ? "fr-FR" : "en-US");

/** Display price with the store currency, correct decimals (0/2/3), and localized symbol. */
export function formatMoney(minor: number, currency: CurrencyCode, lang = "en"): string {
  const d = decimalsOf(currency);
  const num = new Intl.NumberFormat(localeFor(lang), {
    minimumFractionDigits: d === 3 ? 3 : minor % 10 ** d === 0 ? 0 : d,
    maximumFractionDigits: d,
  }).format(minor / 10 ** d);
  const sym = (CURRENCIES[currency]?.symbol as Record<string, string> | undefined)?.[lang] ?? currency;
  const prefix = sym === "$" || sym === "€" || sym === "₦" || sym === "R" || sym === "GH₵" || sym === "KSh";
  if (lang === "ar") return `\u2067${num} ${sym}\u2069`; // RLI…PDI: keep "299 د.م." in correct visual order inside LTR containers
  return prefix ? `${sym}${num}` : `${num} ${sym}`;
}
