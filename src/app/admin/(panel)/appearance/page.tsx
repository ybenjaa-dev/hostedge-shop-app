import { requirePerm } from "@/lib/auth";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { PageHeader } from "@/features/admin/components/ui";
import { AppearanceEditor } from "@/features/appearance/components/editor";

export const metadata = { title: "Appearance" };

export default async function AppearancePage() {
  await requirePerm("appearance.edit");
  const s = await getSettings();
  return (
    <div>
      <PageHeader title="Appearance" sub="Branding, homepage and storefront content. Changes preview live; nothing is published until you save." />
      <AppearanceEditor
        original={DEFAULT_SETTINGS.branding}
        initial={{ branding: s.branding, hero: s.hero, home: s.home, announcement: s.announcement, footer: s.footer, trust: s.trust }}
        storeName={s.store.name} tagline={s.store.tagline} currency={s.store.currency} defaultLang={s.store.defaultLang}
      />
    </div>
  );
}
