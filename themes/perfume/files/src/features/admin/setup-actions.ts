"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { clearMemo } from "@/lib/mem-cache";
import { ensureSchema } from "@/db/ensure-schema";
import { createSession, createUser, hasAnyUser, logActivity } from "@/lib/auth";
import { DEFAULT_SETTINGS, saveSettings } from "@/lib/settings";
import { CURRENCIES } from "@/lib/money";
import { COUNTRIES } from "@/lib/phone";
import { seedCities, seedPages, seedSampleData } from "./seed";
import { LANGS } from "@/lib/i18n-core";

const schema = z.object({
  storeName: z.string().trim().min(2).max(60),
  country: z.string().length(2),
  currency: z.string().refine((c) => c in CURRENCIES),
  language: z.enum(LANGS),
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  sample: z.string().optional(),
});

export type SetupState = { error?: string; fields?: Record<string, string> } | undefined;

export async function runSetup(_prev: SetupState, form: FormData): Promise<SetupState> {
  await ensureSchema();
  if (await hasAnyUser()) redirect("/admin/login");
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] = i.message;
    return { error: "Please check the highlighted fields.", fields };
  }
  const d = parsed.data;
  const env = getEnv();
  const country = COUNTRIES.find((c) => c.code === d.country)!;
  const dec = CURRENCIES[d.currency]!.decimals;

  const userId = await createUser({ email: d.email, name: d.name, password: d.password, role: "owner" });
  await saveSettings("store", { ...DEFAULT_SETTINGS.store, name: d.storeName, country: d.country, currency: d.currency, defaultLang: d.language, countries: [d.country], email: d.email });
  await saveSettings("checkout", { ...DEFAULT_SETTINGS.checkout, defaultShippingFee: 30 * 10 ** dec });
  await saveSettings("setupDone", true);
  await seedCities(env, d.country, 30 * 10 ** dec);
  await seedPages(env);
  if (d.sample) {
    await seedSampleData(env, d.currency);
    await saveSettings("hero", {
      slides: [{ image: "uploads/sample-hero.svg", title: { en: "Find the scent that is yours", fr: "Trouvez le parfum qui vous ressemble", ar: "اعثر على العطر الذي يشبهك" }, sub: { en: "Eau de parfum, cologne and gift sets. Open the box with the courier, pay only when you love it.", fr: "Eaux de parfum, colognes et coffrets. Ouvrez le colis devant le livreur, payez quand vous êtes conquis.", ar: "عطور وكولونيا وأطقم هدايا. افتح العلبة أمام المندوب وادفع عندما تحبه." }, cta: { en: "Discover the collection", fr: "Découvrir la collection", ar: "اكتشف المجموعة" }, href: "/shop" }],
    });
  }
  clearMemo();
  await createSession(userId);
  await logActivity({ id: userId, name: d.name }, "setup.completed", "store", undefined, { country: country.code });
  redirect("/admin");
}
