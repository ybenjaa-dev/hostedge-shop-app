import { redirect } from "next/navigation";
import { getSessionUser, hasAnyUser } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

/** Full-screen tools (the appearance studio): no admin sidebar or header, like a theme editor. Signed-in team members only. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSessionUser())) redirect((await hasAnyUser()) ? "/admin/login" : "/setup");
  return <div className="relative h-dvh overflow-hidden bg-bg">{children}</div>;
}
