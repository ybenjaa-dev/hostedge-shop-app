import { isStatus, type OrderStatus } from "@/lib/order-status";

/** Normalise a raw carrier status for map lookup. */
export const normStatus = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, " ");

export function mapCarrierStatus(map: Record<string, OrderStatus>, raw: string | null | undefined): OrderStatus | null {
  if (!raw) return null;
  const n = normStatus(raw);
  for (const [k, v] of Object.entries(map)) if (normStatus(k) === n && isStatus(v)) return v;
  return null;
}

/**
 * Generic COD-courier vocabulary (EN/FR). Used only for manual status words / export-only carriers;
 * live adapters must ship their own documented map.
 */
export const GENERIC_STATUS_MAP: Record<string, OrderStatus> = {
  "picked up": "shipped", "pickup done": "shipped", "ramasse": "shipped", "collected": "shipped", "in transit": "shipped", "en transit": "shipped", "shipped": "shipped",
  "out for delivery": "out_for_delivery", "en cours de livraison": "out_for_delivery", "en livraison": "out_for_delivery",
  "delivered": "delivered", "livre": "delivered", "livree": "delivered",
  "delivery failed": "delivery_failed", "echec de livraison": "delivery_failed", "refused": "delivery_failed", "refuse": "delivery_failed", "no answer": "delivery_failed", "unreachable": "delivery_failed", "postponed": "delivery_failed",
  "returned": "returned", "retourne": "returned", "return to sender": "returned",
};
