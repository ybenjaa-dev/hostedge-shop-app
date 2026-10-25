import { cache } from "react";
import { getDb, schema } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import type { I18n, Lang } from "@/lib/i18n-core";
import { sql } from "drizzle-orm";
import type { OrderStatus, StatusDef } from "@/lib/order-status";

export type HeroSlide = { image: string; title: I18n; sub: I18n; cta: I18n; href: string; cta2?: I18n; href2?: string };
export type HomeSection = { id: "hero" | "categories" | "featured" | "bestsellers" | "banner" | "reviews" | "trust"; visible: boolean };
export type TrustBadge = { icon: "cod" | "returns" | "delivery" | "secure" | "support" | "quality"; title: I18n; text: I18n };

export type Settings = {
  setupDone: boolean;
  store: {
    name: string;
    tagline: I18n;
    country: string;
    currency: string;
    defaultLang: Lang;
    langs: Lang[];
    phones: string[];
    whatsapp: string;
    email: string;
    address: I18n;
    hours: I18n;
    countries: string[];
    taxRateBp: number;
    taxInclusive: boolean;
  };
  social: { instagram: string; facebook: string; tiktok: string; snapchat: string; youtube: string; x: string; whatsappChannel: string };
  branding: {
    logo: string;
    favicon: string;
    primary: string;
    secondary: string;
    accent: string;
    buttonStyle: "rounded" | "pill" | "square";
    fontLatin: string;
    fontArabic: string;
  };
  checkout: {
    codMode: boolean;
    codFee: number;
    freeShippingThreshold: number;
    defaultShippingFee: number;
    formPlacement: "inline" | "popup" | "page";
    confirmationStep: boolean;
    duplicateWindowMin: number;
    ratePerHourPerIp: number;
    ratePerDayPerPhone: number;
    bundlesInForm: boolean;
    reviewsAutoApprove: boolean;
  };
  announcement: { enabled: boolean; text: I18n; href: string };
  hero: { slides: HeroSlide[] };
  home: { sections: HomeSection[]; banner: { image: string; title: I18n; sub: I18n; href: string } };
  trust: TrustBadge[];
  footer: { text: I18n };
  analytics: { metaPixel: string; tiktokPixel: string; ga: string; snapPixel: string };
  statuses: Partial<Record<OrderStatus, Partial<StatusDef>>>;
  templates: { confirm: I18n; shipped: I18n; delivered: I18n; followup: I18n };
};

export const DEFAULT_SETTINGS: Settings = {
  setupDone: false,
  store: {
    name: "My Store",
    tagline: { en: "Clean, effective beauty — pay when it arrives.", fr: "Une beauté saine et efficace — payez à la livraison.", ar: "جمال نقي وفعّال — ادفعي عند الاستلام." },
    country: "MA",
    currency: "MAD",
    defaultLang: "fr",
    langs: ["ar", "fr", "en"],
    phones: [],
    whatsapp: "",
    email: "",
    address: {},
    hours: {},
    countries: ["MA"],
    taxRateBp: 0,
    taxInclusive: true,
  },
  social: { instagram: "", facebook: "", tiktok: "", snapchat: "", youtube: "", x: "", whatsappChannel: "" },
  branding: {
    logo: "",
    favicon: "",
    primary: "#7a2e46",
    secondary: "#3a1f28",
    accent: "#c98f78",
    buttonStyle: "pill",
    fontLatin: "DM Sans",
    fontArabic: "Tajawal",
  },
  checkout: {
    codMode: true,
    codFee: 0,
    freeShippingThreshold: 0,
    defaultShippingFee: 3000,
    formPlacement: "inline",
    confirmationStep: true,
    duplicateWindowMin: 30,
    ratePerHourPerIp: 8,
    ratePerDayPerPhone: 5,
    bundlesInForm: true,
    reviewsAutoApprove: false,
  },
  announcement: { enabled: true, text: { en: "Free delivery · Pay when you receive", fr: "Livraison rapide · Paiement à la livraison", ar: "الدفع عند الاستلام · توصيل سريع" }, href: "" },
  hero: { slides: [] },
  home: {
    sections: [
      { id: "hero", visible: true },
      { id: "trust", visible: true },
      { id: "categories", visible: true },
      { id: "featured", visible: true },
      { id: "banner", visible: false },
      { id: "bestsellers", visible: true },
      { id: "reviews", visible: true },
    ],
    banner: { image: "", title: {}, sub: {}, href: "" },
  },
  trust: [
    { icon: "quality", title: { en: "Carefully selected", fr: "Sélection rigoureuse", ar: "اختيار دقيق" }, text: { en: "Formulas we would use ourselves", fr: "Des formules que nous utiliserions nous-mêmes", ar: "تركيبات نستخدمها بأنفسنا" } },
    { icon: "cod", title: { en: "Pay on delivery", fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" }, text: { en: "Open your parcel, then pay the courier", fr: "Ouvrez votre colis puis payez le livreur", ar: "افتحي طردك ثم ادفعي للمندوب" } },
    { icon: "returns", title: { en: "Easy returns", fr: "Retours faciles", ar: "إرجاع سهل" }, text: { en: "Not the right shade? We'll swap it", fr: "Pas la bonne teinte ? On l'échange", ar: "اللون غير مناسب؟ نبدّله لك" } },
  ],
  footer: { text: {} },
  analytics: { metaPixel: "", tiktokPixel: "", ga: "", snapPixel: "" },
  statuses: {},
  templates: {
    confirm: {
      en: "Hello {name}, this is {store}. Please confirm your order {order} ({total}). Reply YES to confirm.",
      fr: "Bonjour {name}, ici {store}. Merci de confirmer votre commande {order} ({total}). Répondez OUI pour confirmer.",
      ar: "مرحباً {name}، معكم {store}. نرجو تأكيد طلبكم رقم {order} بقيمة {total}. أجب بنعم للتأكيد.",
    },
    shipped: {
      en: "Hi {name}, your order {order} is on its way. Tracking: {tracking}",
      fr: "Bonjour {name}, votre commande {order} est expédiée. Suivi : {tracking}",
      ar: "مرحباً {name}، تم شحن طلبكم {order}. رقم التتبع: {tracking}",
    },
    delivered: {
      en: "Thank you {name}! Order {order} was delivered. We hope you love it.",
      fr: "Merci {name} ! Votre commande {order} a été livrée.",
      ar: "شكراً {name}! تم تسليم طلبكم {order}.",
    },
    followup: {
      en: "Hi {name}, we noticed you started an order at {store}. Need help finishing it?",
      fr: "Bonjour {name}, vous avez commencé une commande chez {store}. Besoin d'aide ?",
      ar: "مرحباً {name}، لاحظنا أنك بدأت طلباً لدى {store}. هل تحتاج مساعدة لإكماله؟",
    },
  },
};

function merge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) || typeof base !== "object" || base === null) return over as T;
  if (typeof over !== "object" || Array.isArray(over)) return over as T;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    out[k] = k in out ? merge(out[k], v) : v;
  }
  return out as T;
}

/** One query for all settings, merged over defaults. Cached per request. */
export const getSettings = cache(async (): Promise<Settings> => {
  await ensureSchema();
  const rows = await getDb().select().from(schema.settings);
  let s = DEFAULT_SETTINGS;
  for (const r of rows) {
    if (!(r.key in DEFAULT_SETTINGS)) continue;
    try {
      s = { ...s, [r.key]: merge((s as Record<string, unknown>)[r.key], JSON.parse(r.value)) };
    } catch {}
  }
  return s;
});

export async function saveSettings<K extends keyof Settings>(key: K, value: Settings[K]) {
  await ensureSchema();
  await getDb()
    .insert(schema.settings)
    .values({ key, value: JSON.stringify(value) })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: JSON.stringify(value) } });
}

export async function getRaw(key: string): Promise<string | null> {
  await ensureSchema();
  const r = await getDb().select().from(schema.settings).where(sql`${schema.settings.key} = ${key}`).get();
  return r?.value ?? null;
}
export async function setRaw(key: string, value: string) {
  await getDb().insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
}
