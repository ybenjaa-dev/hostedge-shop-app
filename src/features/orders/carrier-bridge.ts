"use server";
import { z } from "zod";
import { assertUser } from "@/lib/auth";

/**
 * Thin bridge so the orders UI doesn't depend on shipping internals. The shipping service
 * (src/features/shipping/service.ts) is loaded lazily and permission is checked here too.
 */
export async function bulkSendAction(ids: string[], carrierId: string): Promise<{ orderId: string; ok: boolean; tracking?: string; error?: string }[]> {
  const user = await assertUser("staff");
  const list = z.array(z.string().min(1)).min(1).max(100).parse(ids);
  const id = z.string().min(1).max(40).parse(carrierId);
  try {
    const mod = await import("@/features/shipping/service");
    return await mod.sendOrdersToCarrier(list, id, { id: user.id, name: user.name });
  } catch (e) {
    return list.map((orderId) => ({ orderId, ok: false, error: e instanceof Error ? e.message : "Carrier service unavailable" }));
  }
}

export async function sendOneAction(orderId: string, carrierId: string): Promise<{ ok: boolean; tracking?: string; error?: string }> {
  const r = await bulkSendAction([orderId], carrierId);
  return r[0] ?? { ok: false, error: "No result" };
}

export async function manualTrackingAction(orderId: string, carrierId: string, tracking: string): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser("staff");
  const t = z.string().trim().min(3).max(60).regex(/^[\w\-./ ]+$/, "Invalid tracking number").safeParse(tracking);
  if (!t.success) return { ok: false, error: t.error.issues[0]?.message ?? "Invalid tracking number" };
  const mod = await import("@/features/shipping/service");
  return mod.setManualTracking(z.string().min(1).parse(orderId), z.string().min(1).max(40).parse(carrierId), t.data, { id: user.id, name: user.name });
}
