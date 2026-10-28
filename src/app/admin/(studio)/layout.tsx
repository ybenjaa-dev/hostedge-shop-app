import { redirect } from "next/navigation";
import { requireUser, hasAnyUser } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false } };

/** Full-screen tools (the appearance studio): no admin sidebar or header, like a theme editor. Signed-in team members only. */
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAnyUser())) redirect("/setup");
  await requireUser();
  return <div className="min-h-dvh bg-bg">{children}</div>;
}
