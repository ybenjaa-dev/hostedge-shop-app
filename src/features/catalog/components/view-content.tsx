"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

export function ViewContent({ id, value, currency }: { id: string; value: number; currency: string }) {
  useEffect(() => { track("ViewContent", { ids: [id], value, currency }); }, [id, value, currency]);
  return null;
}
