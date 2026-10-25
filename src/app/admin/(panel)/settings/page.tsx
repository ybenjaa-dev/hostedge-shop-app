import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/features/admin/components/ui";
import { Tabs } from "@/features/settings/components/tabs";
import { StoreSection, SocialSection, CheckoutSection, AnalyticsSection, StatusesSection, TemplatesSection } from "@/features/settings/components/store-sections";
import { CitiesSection } from "@/features/settings/components/cities-section";
import { one } from "@/features/settings/lib";

export const metadata = { title: "Settings" };
const TABS = [
  { id: "store", label: "Store" }, { id: "checkout", label: "Checkout" }, { id: "cities", label: "Cities" }, { id: "social", label: "Social links" },
  { id: "analytics", label: "Analytics" }, { id: "statuses", label: "Order statuses" }, { id: "templates", label: "Messages" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireOwner();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.id === one(sp.tab)) ? one(sp.tab) : "store";
  const s = await getSettings();
  return (
    <div>
      <PageHeader title="Settings" sub="Store configuration, checkout and shipping rules." />
      <Tabs base="/admin/settings" current={tab} items={TABS} />
      <div className="max-w-5xl space-y-5">
        {tab === "store" && <StoreSection s={s} />}
        {tab === "checkout" && <CheckoutSection s={s} />}
        {tab === "cities" && <CitiesSection s={s} sp={{ country: one(sp.country), q: one(sp.q), page: one(sp.page) }} />}
        {tab === "social" && <SocialSection s={s} />}
        {tab === "analytics" && <AnalyticsSection s={s} />}
        {tab === "statuses" && <StatusesSection s={s} />}
        {tab === "templates" && <TemplatesSection s={s} />}
      </div>
    </div>
  );
}
