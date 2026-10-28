import { redirect } from "next/navigation";
import { GOOGLE } from "@/features/visitors/signals";

export const metadata = { robots: { index: false, follow: false } };

export default function BlockedPage() {
  redirect(GOOGLE);
}
