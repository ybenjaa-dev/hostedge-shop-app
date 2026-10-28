"use client";
import { AdminErrorBody } from "@/components/admin-error";

export default function AdminError(p: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorBody {...p} />;
}
