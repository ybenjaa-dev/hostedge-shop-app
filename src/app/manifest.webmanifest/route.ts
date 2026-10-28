import { dirOf } from "@/lib/i18n-core";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n";
import { getEnv } from "@/lib/env";
import { isHex } from "@/lib/color";

export const dynamic = "force-dynamic";

/** Web app manifest built from the store's name, colours and logo (changes in Admin → Appearance apply immediately). */
export async function GET() {
  const [s, lang] = [await getSettings(), await getLang()];
  const b = s.branding;
  const hasRaster = !!(b.favicon || b.logo) && !/\.svg$/i.test(b.favicon || b.logo);
  const png = hasRaster && !!getEnv().IMAGES;
  const icon = (size: number, purpose: "any" | "maskable") => ({ src: `/pwa/icon/${size}`, sizes: hasRaster ? `${size}x${size}` : "any", type: !hasRaster ? "image/svg+xml" : png ? "image/png" : "image/webp", purpose });
  return Response.json({
    name: s.store.name, short_name: s.store.name.slice(0, 12), description: (s.store.tagline[lang] || s.store.tagline.en || s.store.tagline.fr || "").slice(0, 200) || undefined,
    id: "/", start_url: "/?source=pwa", scope: "/", display: "standalone", orientation: "portrait-primary", lang, dir: dirOf(lang),
    background_color: isHex(b.secondary) ? "#ffffff" : "#ffffff", theme_color: isHex(b.primary) ? b.primary : "#0f766e",
    icons: [icon(192, "any"), icon(512, "any"), icon(512, "maskable")],
    shortcuts: [{ name: s.store.name, url: "/shop" }],
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=300" } });
}
