"use client";
import { AdminErrorBody } from "@/components/admin-error";

export default function LoginError(p: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-h-dvh bg-bg p-4"><AdminErrorBody {...p} home="/" homeLabel="Back to the shop" /></div>;
}
