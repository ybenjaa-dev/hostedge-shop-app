import { dirOf } from "@/lib/i18n-core";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n";
import { DICT } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";

/** Everything the storefront's global client scripts need: which features are on, the push public key, and the labels for the current language. */
export async function GET() {
  const [s, lang] = [await getSettings(), await getLang()];
  const d = DICT[lang] as Record<string, string>;
  const labels = Object.fromEntries(Object.entries(d).filter(([k]) => /^(search\.suggest|pwa|privacy|push)\./.test(k)));
  const iconKey = s.branding.favicon || s.branding.logo;
  return Response.json({
    lang, dir: dirOf(lang), store: s.store.name, icon: iconKey ? fileUrl(iconKey, "thumb") : "",
    pwa: s.engage.pwa, visitors: s.engage.visitors, push: s.engage.push && !!s.engage.vapidPublic, pushKey: s.engage.vapidPublic, pushDelaySec: s.engage.pushDelaySec,
    labels,
  }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
