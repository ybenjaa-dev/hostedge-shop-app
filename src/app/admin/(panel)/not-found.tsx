import { AdminNotFoundBody } from "@/components/admin-not-found";

export const metadata = { title: "Not found", robots: { index: false, follow: false } };

export default function AdminNotFound() {
  return <AdminNotFoundBody />;
}
