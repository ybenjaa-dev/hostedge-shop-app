"use server";
import { z } from "zod";
import { run, audit, type ActionState } from "@/features/admin/run";
import { saveSettings, type Settings } from "@/lib/settings";
import { ARABIC_FONTS, LATIN_FONTS } from "@/lib/fonts";
import { jsonField, parse, refresh, fail } from "@/features/settings/lib";

const t = (max: number) => z.string().max(max).optional();
const i18n = (max = 300) => z.object({ ar: t(max), fr: t(max), en: t(max) }).transform((o) => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) if (v && v.trim()) out[k] = v.trim();
  return out;
});
const link = z.string().max(300).refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Links must start with / or https://");
const image = z.string().max(300);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colors must look like #0f766e");
const SECTION_IDS = ["hero", "categories", "featured", "bestsellers", "banner", "reviews", "trust"] as const;

const payload = z.object({
  branding: z.object({
    logo: image, favicon: image, primary: hex, secondary: hex, accent: hex,
    buttonStyle: z.enum(["rounded", "pill", "square"]),
    fontLatin: z.string().refine((f) => (LATIN_FONTS as readonly string[]).includes(f), "Unknown Latin font"),
    fontArabic: z.string().refine((f) => (ARABIC_FONTS as readonly string[]).includes(f), "Unknown Arabic font"),
  }),
  hero: z.object({
    slides: z.array(z.object({ image, title: i18n(160), sub: i18n(300), cta: i18n(60), href: link, cta2: i18n(60).optional(), href2: link.optional() })).max(10, "At most 10 slides"),
  }),
  home: z.object({
    sections: z.array(z.object({ id: z.enum(SECTION_IDS), visible: z.boolean() })).length(SECTION_IDS.length, "All sections are required"),
    banner: z.object({ image, title: i18n(160), sub: i18n(300), href: link }),
  }),
  announcement: z.object({ enabled: z.boolean(), text: i18n(200), href: link }),
  footer: z.object({ text: i18n(1000) }),
  trust: z.array(z.object({ icon: z.enum(["cod", "returns", "delivery", "secure", "support", "quality"]), title: i18n(60), text: i18n(160) })).max(8, "At most 8 trust badges"),
});

export async function saveAppearance(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("appearance.edit", async (user) => {
    const p = parse(payload, jsonField(form, "payload"));
    if (!p.ok) return p.state;
    const d = p.data;
    const empty = d.hero.slides.findIndex((sl) => !sl.image && !Object.keys(sl.title).length);
    if (empty >= 0) return fail(`Slide ${empty + 1} needs an image or a title`);
    if (new Set(d.home.sections.map((s) => s.id)).size !== SECTION_IDS.length) return fail("Each homepage section must appear exactly once");
    await saveSettings("branding", d.branding as Settings["branding"]);
    await saveSettings("hero", { slides: d.hero.slides as Settings["hero"]["slides"] });
    await saveSettings("home", d.home as Settings["home"]);
    await saveSettings("announcement", d.announcement as Settings["announcement"]);
    await saveSettings("footer", d.footer as Settings["footer"]);
    await saveSettings("trust", d.trust as Settings["trust"]);
    await audit(user, "appearance.update", "settings", "appearance");
    refresh();
    return { message: "Appearance saved — the storefront is updated" };
  });
}
