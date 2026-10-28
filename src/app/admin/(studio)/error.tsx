"use client";
import { AdminErrorBody } from "@/components/admin-error";

export default function StudioError(p: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="h-full overflow-auto bg-bg p-4"><AdminErrorBody {...p} /></div>;
}
