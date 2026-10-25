import { redirect } from "next/navigation";
import { requireUser, hasAnyUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logoutAction } from "@/features/admin/auth-actions";
import { AdminChrome } from "@/features/admin/components/sidebar";

export const metadata = { robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAnyUser())) redirect("/setup");
  const user = await requireUser();
  const s = await getSettings();
  return <AdminChrome role={user.role} userName={user.name} storeName={s.store.name} logout={logoutAction}>{children}</AdminChrome>;
}
