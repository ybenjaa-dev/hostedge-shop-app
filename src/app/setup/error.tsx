"use client";
import { AdminErrorBody } from "@/components/admin-error";

export default function SetupError(p: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-h-dvh bg-bg p-4"><AdminErrorBody {...p} home="/setup" homeLabel="Restart setup" /></div>;
}
