export type Country = {
  code: string; // ISO-2
  dial: string; // without +
  name: { en: string; fr: string; ar: string };
  /** national significant number (no leading 0) */
  national: RegExp;
  flag: string;
  currency: string;
};

export const COUNTRIES: Country[] = [
  { code: "MA", dial: "212", name: { en: "Morocco", fr: "Maroc", ar: "المغرب" }, national: /^[5-7]\d{8}$/, flag: "🇲🇦", currency: "MAD" },
  { code: "SA", dial: "966", name: { en: "Saudi Arabia", fr: "Arabie saoudite", ar: "السعودية" }, national: /^5\d{8}$/, flag: "🇸🇦", currency: "SAR" },
  { code: "AE", dial: "971", name: { en: "United Arab Emirates", fr: "Émirats arabes unis", ar: "الإمارات" }, national: /^5\d{8}$/, flag: "🇦🇪", currency: "AED" },
  { code: "KW", dial: "965", name: { en: "Kuwait", fr: "Koweït", ar: "الكويت" }, national: /^[569]\d{7}$/, flag: "🇰🇼", currency: "KWD" },
  { code: "QA", dial: "974", name: { en: "Qatar", fr: "Qatar", ar: "قطر" }, national: /^[3567]\d{7}$/, flag: "🇶🇦", currency: "QAR" },
  { code: "BH", dial: "973", name: { en: "Bahrain", fr: "Bahreïn", ar: "البحرين" }, national: /^[36]\d{7}$/, flag: "🇧🇭", currency: "BHD" },
  { code: "OM", dial: "968", name: { en: "Oman", fr: "Oman", ar: "عُمان" }, national: /^[79]\d{7}$/, flag: "🇴🇲", currency: "OMR" },
  { code: "DZ", dial: "213", name: { en: "Algeria", fr: "Algérie", ar: "الجزائر" }, national: /^[567]\d{8}$/, flag: "🇩🇿", currency: "DZD" },
  { code: "TN", dial: "216", name: { en: "Tunisia", fr: "Tunisie", ar: "تونس" }, national: /^[2-59]\d{7}$/, flag: "🇹🇳", currency: "TND" },
  { code: "EG", dial: "20", name: { en: "Egypt", fr: "Égypte", ar: "مصر" }, national: /^1\d{9}$/, flag: "🇪🇬", currency: "EGP" },
  { code: "SN", dial: "221", name: { en: "Senegal", fr: "Sénégal", ar: "السنغال" }, national: /^7\d{8}$/, flag: "🇸🇳", currency: "XOF" },
  { code: "CI", dial: "225", name: { en: "Côte d'Ivoire", fr: "Côte d'Ivoire", ar: "ساحل العاج" }, national: /^\d{10}$/, flag: "🇨🇮", currency: "XOF" },
  { code: "NG", dial: "234", name: { en: "Nigeria", fr: "Nigéria", ar: "نيجيريا" }, national: /^[789]\d{9}$/, flag: "🇳🇬", currency: "NGN" },
  { code: "GH", dial: "233", name: { en: "Ghana", fr: "Ghana", ar: "غانا" }, national: /^[235]\d{8}$/, flag: "🇬🇭", currency: "GHS" },
  { code: "KE", dial: "254", name: { en: "Kenya", fr: "Kenya", ar: "كينيا" }, national: /^[17]\d{8}$/, flag: "🇰🇪", currency: "KES" },
  { code: "ZA", dial: "27", name: { en: "South Africa", fr: "Afrique du Sud", ar: "جنوب أفريقيا" }, national: /^[6-8]\d{8}$/, flag: "🇿🇦", currency: "ZAR" },
  { code: "FR", dial: "33", name: { en: "France", fr: "France", ar: "فرنسا" }, national: /^[67]\d{8}$/, flag: "🇫🇷", currency: "EUR" },
];

export const countryByCode = (c: string) => COUNTRIES.find((x) => x.code === c);

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function latinDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_DIGITS.indexOf(d);
    return String(i >= 0 ? i : PERSIAN_DIGITS.indexOf(d));
  });
}

export type PhoneResult = { ok: true; e164: string; national: string; country: string } | { ok: false; reason: "empty" | "invalid" };

/**
 * Normalize a phone number typed by a customer to digits-only E.164 (no '+').
 * Accepts "0612345678", "612345678", "+212 612-345678", "00212612345678", Arabic digits.
 */
export function normalizePhone(input: string, defaultCountry: string): PhoneResult {
  let s = latinDigits(input ?? "").replace(/[\s().\-]/g, "");
  if (!s) return { ok: false, reason: "empty" };
  const hadPlus = s.startsWith("+");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  s = s.replace(/[^\d+]/g, "");
  const def = countryByCode(defaultCountry);
  if (s.startsWith("+") || hadPlus) {
    const digits = s.replace(/\D/g, "");
    // longest matching dial code first
    const match = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial) && c.national.test(stripTrunk(digits.slice(c.dial.length))));
    if (!match) return { ok: false, reason: "invalid" };
    const nat = stripTrunk(digits.slice(match.dial.length));
    return { ok: true, e164: match.dial + nat, national: nat, country: match.code };
  }
  if (!def) return { ok: false, reason: "invalid" };
  // user typed the dial code without '+' (e.g. 212612345678)
  if (s.startsWith(def.dial) && def.national.test(stripTrunk(s.slice(def.dial.length)))) {
    const nat = stripTrunk(s.slice(def.dial.length));
    return { ok: true, e164: def.dial + nat, national: nat, country: def.code };
  }
  const nat = stripTrunk(s);
  if (!def.national.test(nat)) return { ok: false, reason: "invalid" };
  return { ok: true, e164: def.dial + nat, national: nat, country: def.code };
}

function stripTrunk(n: string) {
  return n.startsWith("0") ? n.slice(1) : n;
}

export function whatsappLink(e164Digits: string, text?: string) {
  const d = e164Digits.replace(/\D/g, "");
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatPhoneIntl(e164: string) {
  const c = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((x) => e164.startsWith(x.dial));
  return c ? `+${c.dial} ${e164.slice(c.dial.length)}` : `+${e164}`;
}
