import { AdminNotFoundBody } from "@/components/admin-not-found";

export const metadata = { title: "Not found", robots: { index: false, follow: false } };

export default function StudioNotFound() {
  return <div className="h-full overflow-auto bg-bg p-4"><AdminNotFoundBody /></div>;
}
