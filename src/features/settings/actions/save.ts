"use server";
import { z } from "zod";
import { run, audit, fd, fdI18n, type ActionState } from "@/features/admin/run";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";
import { CURRENCIES, toMinor } from "@/lib/money";
import { countryByCode, normalizePhone } from "@/lib/phone";
import { LANGS, isLang, type Lang } from "@/lib/i18n-core";
import { DEFAULT_STATUS_DEFS, ORDER_STATUSES, type StatusDef } from "@/lib/order-status";
import { isHex } from "@/lib/color";
import { parse, refresh, fail } from "../lib";

const phoneLike = /^[+\d\s().-]{6,24}$/;

export async function saveStore(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const langs = form.getAll("langs").filter(isLang) as Lang[];
    const countries = form.getAll("countries").map(String).filter((c) => countryByCode(c));
    const phones = fd(form, "phones").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    const p = parse(
      z.object({
        name: z.string().min(1, "Store name is required").max(80),
        country: z.string().refine((c) => !!countryByCode(c), "Choose a valid country"),
        currency: z.string().refine((c) => c in CURRENCIES, "Unsupported currency"),
        defaultLang: z.enum(LANGS),
        email: z.union([z.literal(""), z.email("Invalid email")]),
        whatsapp: z.string().max(30),
        tax: z.string().regex(/^\d{1,3}(\.\d{1,2})?$/, "Tax rate must be a number like 20 or 5.5"),
        phones: z.array(z.string().regex(phoneLike, "Invalid phone number")).max(6),
      }),
      { name: fd(form, "name"), country: fd(form, "country"), currency: fd(form, "currency"), defaultLang: fd(form, "defaultLang"), email: fd(form, "email"), whatsapp: fd(form, "whatsapp"), tax: fd(form, "tax") || "0", phones },
    );
    if (!p.ok) return p.state;
    const d = p.data;
    const tax = parseFloat(d.tax);
    if (tax > 100) return fail("Tax rate cannot exceed 100%");
    let whatsapp = d.whatsapp;
    if (whatsapp) {
      const n = normalizePhone(whatsapp, d.country);
      if (!n.ok) return fail("WhatsApp number is invalid. Include the country code, e.g. +212612345678.");
      whatsapp = n.e164;
    }
    const finalLangs = [...new Set<Lang>([...langs, d.defaultLang])];
    const finalCountries = [...new Set([...countries, d.country])];
    const prev = await getSettings();
    const store: Settings["store"] = {
      ...prev.store,
      name: d.name, tagline: fdI18n(form, "tagline"), country: d.country, currency: d.currency, defaultLang: d.defaultLang,
      langs: LANGS.filter((l) => finalLangs.includes(l)), phones: d.phones, whatsapp, email: d.email,
      address: fdI18n(form, "address"), hours: fdI18n(form, "hours"), countries: finalCountries,
      taxRateBp: Math.round(tax * 100), taxInclusive: form.get("taxInclusive") === "1",
    };
    await saveSettings("store", store);
    await audit(user, "settings.store", "settings", "store", { currency: d.currency });
    refresh();
    return { message: prev.store.currency !== d.currency ? "Saved. Existing prices were not converted." : "Store settings saved" };
  });
}

export async function saveSocial(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const keys = ["instagram", "facebook", "tiktok", "snapchat", "youtube", "x", "whatsappChannel"] as const;
    const out = {} as Settings["social"];
    for (const k of keys) {
      const v = fd(form, k);
      if (v && !/^https?:\/\/[^\s]+$/i.test(v)) return fail(`${k}: enter a full link starting with https://`);
      if (v.length > 300) return fail(`${k}: link is too long`);
      out[k] = v;
    }
    await saveSettings("social", out);
    await audit(user, "settings.social", "settings", "social");
    refresh();
    return { message: "Social links saved" };
  });
}

export async function saveCheckout(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const s = await getSettings();
    const cur = s.store.currency;
    const money = (key: string, label: string) => {
      const raw = fd(form, key) || "0";
      const n = toMinor(raw, cur);
      if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) throw new FieldError(`${label} must be a valid amount`);
      return n;
    };
    try {
      const int = (key: string, label: string, min: number, max: number) => {
        const n = Number(fd(form, key));
        if (!Number.isInteger(n) || n < min || n > max) throw new FieldError(`${label} must be a whole number between ${min} and ${max}`);
        return n;
      };
      const placement = fd(form, "formPlacement");
      if (!["inline", "popup", "page"].includes(placement)) return fail("Choose a form placement");
      const checkout: Settings["checkout"] = {
        codMode: form.get("codMode") === "1",
        codFee: money("codFee", "COD fee"),
        freeShippingThreshold: money("freeShippingThreshold", "Free-shipping threshold"),
        defaultShippingFee: money("defaultShippingFee", "Default shipping fee"),
        formPlacement: placement as Settings["checkout"]["formPlacement"],
        confirmationStep: form.get("confirmationStep") === "1",
        duplicateWindowMin: int("duplicateWindowMin", "Duplicate window", 0, 1440),
        ratePerHourPerIp: int("ratePerHourPerIp", "Orders per hour per IP", 1, 1000),
        ratePerDayPerPhone: int("ratePerDayPerPhone", "Orders per day per phone", 1, 1000),
        bundlesInForm: form.get("bundlesInForm") === "1",
        reviewsAutoApprove: form.get("reviewsAutoApprove") === "1",
      };
      await saveSettings("checkout", checkout);
      await audit(user, "settings.checkout", "settings", "checkout", { codMode: checkout.codMode });
      refresh();
      return { message: checkout.codMode ? "Cash on Delivery mode is ON — the cart is hidden" : "Cash on Delivery mode is OFF — cart checkout enabled" };
    } catch (e) {
      if (e instanceof FieldError) return fail(e.message);
      throw e;
    }
  });
}
class FieldError extends Error {}

export async function saveAnalytics(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const idRe = /^[A-Za-z0-9_-]{3,40}$/;
    const out = {} as Settings["analytics"];
    for (const k of ["metaPixel", "tiktokPixel", "ga", "snapPixel"] as const) {
      const v = fd(form, k);
      if (v && !idRe.test(v)) return fail(`${k}: only letters, numbers, - and _ (3–40 characters)`);
      out[k] = v;
    }
    await saveSettings("analytics", out);
    await audit(user, "settings.analytics", "settings", "analytics");
    refresh();
    return { message: "Analytics IDs saved" };
  });
}

export async function saveStatuses(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const out: Settings["statuses"] = {};
    for (const st of ORDER_STATUSES) {
      const def = DEFAULT_STATUS_DEFS[st];
      const ov: Partial<StatusDef> = {};
      const label = fdI18n(form, `st.${st}.label`);
      const changed: Partial<StatusDef["label"]> = {};
      for (const l of LANGS) if (label[l] && label[l] !== def.label[l]) { if (label[l]!.length > 60) return fail(`${st}: label too long`); changed[l] = label[l]; }
      if (Object.keys(changed).length) ov.label = changed as StatusDef["label"];
      const color = fd(form, `st.${st}.color`);
      if (color) {
        if (!isHex(color)) return fail(`${st}: color must look like #1a2b3c`);
        if (color.toLowerCase() !== def.color.toLowerCase()) ov.color = color;
      }
      if (Object.keys(ov).length) out[st] = ov;
    }
    await saveSettings("statuses", out);
    await audit(user, "settings.statuses", "settings", "statuses");
    refresh();
    return { message: "Order statuses saved" };
  });
}

export async function saveTemplates(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const out = {} as Settings["templates"];
    for (const k of ["confirm", "shipped", "delivered", "followup"] as const) {
      const v = fdI18n(form, k);
      for (const t of Object.values(v)) if (t.length > 800) return fail(`${k}: template too long (800 characters max)`);
      out[k] = v;
    }
    await saveSettings("templates", out);
    await audit(user, "settings.templates", "settings", "templates");
    refresh();
    return { message: "Message templates saved" };
  });
}

