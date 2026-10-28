import { cache } from "react";
import { BRAND } from "@/lib/brand";
import { getDb, schema } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import type { I18n, Lang } from "@/lib/i18n-core";
import { sql } from "drizzle-orm";
import type { OrderStatus, StatusDef } from "@/lib/order-status";
import type { OfferTemplate } from "@/lib/offer-templates";

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
    /** inline = opens under the product when the customer taps Order · inline-open = the form is always visible on the page · popup · page */
    formPlacement: "inline" | "inline-open" | "popup" | "page";
    confirmationStep: boolean;
    duplicateWindowMin: number;
    ratePerHourPerIp: number;
    ratePerDayPerPhone: number;
    bundlesInForm: boolean;
    reviewsAutoApprove: boolean;
  };
  /** Default layout of the quantity-offer cards; a product can override it. */
  /** Engagement features. */
  engage: {
    pwa: boolean;           // installable app + offline pages
    visitors: boolean;      // anonymous visitor registry (after the visitor accepts the notice)
    push: boolean;          // Web Push opt-in and sending
    pushDelaySec: number;   // wait this long on the site before offering notifications
    vapidPublic: string;    // public VAPID key (the private one is stored encrypted)
    vapidSubject: string;   // mailto: / https: contact for push services
    langUrls: boolean;      // /ar /fr /en URLs + hreflang + a sitemap per language
  };
  offers: {
    template: OfferTemplate;
    /** One-click add-on offered right after the order is placed (before the thank-you page). */
    upsell: { enabled: boolean; discountPct: number; windowMin: number };
  };
  announcement: { enabled: boolean; text: I18n; href: string };
  hero: { slides: HeroSlide[] };
  home: { sections: HomeSection[]; banner: { image: string; title: I18n; sub: I18n; href: string } };
  trust: TrustBadge[];
  footer: { text: I18n };
  analytics: {
    metaPixel: string; tiktokPixel: string; ga: string; snapPixel: string;
    /** Server-side (Conversions API) behaviour. The access tokens themselves are stored encrypted, never here. */
    capi: { purchaseWhen: "placed" | "confirmed" | "delivered"; statusEvents: boolean; metaTestCode: string; tiktokTestCode: string };
  };
  statuses: Partial<Record<OrderStatus, Partial<StatusDef>>>;
  templates: { confirm: I18n; shipped: I18n; delivered: I18n; followup: I18n };
};

export const DEFAULT_SETTINGS: Settings = {
  setupDone: false,
  store: {
    name: BRAND.name,
    tagline: { en: "Modern essentials, delivered — pay when it arrives.", fr: "Des basiques modernes, livrés — payez à la réception.", ar: "أساسيات عصرية تصلك — ادفع عند الاستلام." },
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
    logo: BRAND.logo,
    favicon: BRAND.icon,
    primary: "#111111",
    secondary: "#111111",
    accent: "#c9b79c",
    buttonStyle: "square",
    fontLatin: "Inter",
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
  engage: { pwa: true, visitors: true, push: true, pushDelaySec: 25, vapidPublic: "", vapidSubject: "", langUrls: true },
  offers: { template: "list", upsell: { enabled: true, discountPct: 10, windowMin: 30 } },
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
    { icon: "cod", title: { en: "Pay on delivery", fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" }, text: { en: "Try it, then pay the courier", fr: "Essayez, puis payez le livreur", ar: "جرّبه ثم ادفع للمندوب" } },
    { icon: "returns", title: { en: "Free size exchange", fr: "Échange de taille gratuit", ar: "تبديل المقاس مجاناً" }, text: { en: "Wrong fit? We swap it", fr: "Mauvaise taille ? On l'échange", ar: "المقاس غير مناسب؟ نبدّله لك" } },
    { icon: "delivery", title: { en: "Fast delivery", fr: "Livraison rapide", ar: "توصيل سريع" }, text: { en: "2–4 days across the country", fr: "2 à 4 jours partout", ar: "من 2 إلى 4 أيام لكل المدن" } },
  ],
  footer: { text: {} },
  analytics: { metaPixel: "", tiktokPixel: "", ga: "", snapPixel: "", capi: { purchaseWhen: "placed", statusEvents: false, metaTestCode: "", tiktokTestCode: "" } },
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
