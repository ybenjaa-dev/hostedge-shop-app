import { requirePerm } from "@/lib/auth";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { getExtra } from "@/lib/appearance-extra-server";
import { AppearanceEditor } from "@/features/appearance/components/editor";

export const metadata = { title: "Appearance" };

export default async function AppearancePage() {
  await requirePerm("appearance.edit");
  const [s, extra] = [await getSettings(), await getExtra()];
  return (
    <AppearanceEditor
      original={DEFAULT_SETTINGS.branding}
      initial={{ branding: s.branding, hero: s.hero, home: s.home, announcement: s.announcement, footer: s.footer, trust: s.trust, extra }}
      storeName={s.store.name} tagline={s.store.tagline} currency={s.store.currency} defaultLang={s.store.defaultLang}
    />
  );
}
