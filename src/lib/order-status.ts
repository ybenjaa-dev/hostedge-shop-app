export const ORDER_STATUSES = [
  "new",
  "pending_confirmation",
  "confirmed",
  "no_answer",
  "postponed",
  "cancelled",
  "ready_to_ship",
  "shipped",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "returned",
  "return_received",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const isStatus = (s: string): s is OrderStatus => (ORDER_STATUSES as readonly string[]).includes(s);

export type StatusDef = { label: { en: string; fr: string; ar: string }; color: string };

/** Defaults; labels/colors can be overridden from Admin → Settings → Order statuses. */
export const DEFAULT_STATUS_DEFS: Record<OrderStatus, StatusDef> = {
  new: { label: { en: "New", fr: "Nouvelle", ar: "جديد" }, color: "#2563eb" },
  pending_confirmation: { label: { en: "Pending confirmation", fr: "En attente de confirmation", ar: "بانتظار التأكيد" }, color: "#d97706" },
  confirmed: { label: { en: "Confirmed", fr: "Confirmée", ar: "مؤكد" }, color: "#0d9488" },
  no_answer: { label: { en: "No answer", fr: "Ne répond pas", ar: "لا يرد" }, color: "#9333ea" },
  postponed: { label: { en: "Postponed", fr: "Reportée", ar: "مؤجل" }, color: "#64748b" },
  cancelled: { label: { en: "Cancelled", fr: "Annulée", ar: "ملغي" }, color: "#dc2626" },
  ready_to_ship: { label: { en: "Ready to ship", fr: "Prête à expédier", ar: "جاهز للشحن" }, color: "#0891b2" },
  shipped: { label: { en: "Shipped / Picked up", fr: "Expédiée / Ramassée", ar: "تم الشحن / الاستلام" }, color: "#4f46e5" },
  out_for_delivery: { label: { en: "Out for delivery", fr: "En cours de livraison", ar: "قيد التوصيل" }, color: "#7c3aed" },
  delivered: { label: { en: "Delivered (cash collected)", fr: "Livrée (cash encaissé)", ar: "تم التسليم (تم تحصيل المبلغ)" }, color: "#16a34a" },
  delivery_failed: { label: { en: "Delivery failed", fr: "Échec de livraison", ar: "فشل التوصيل" }, color: "#ea580c" },
  returned: { label: { en: "Returned", fr: "Retournée", ar: "مرتجع" }, color: "#b91c1c" },
  return_received: { label: { en: "Return received", fr: "Retour reçu", ar: "تم استلام المرتجع" }, color: "#be123c" },
  refunded: { label: { en: "Refunded", fr: "Remboursée", ar: "تم الاسترجاع" }, color: "#475569" },
};

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["pending_confirmation", "confirmed", "no_answer", "postponed", "cancelled"],
  pending_confirmation: ["confirmed", "no_answer", "postponed", "cancelled"],
  confirmed: ["ready_to_ship", "no_answer", "postponed", "cancelled"],
  no_answer: ["confirmed", "no_answer", "postponed", "cancelled", "pending_confirmation"],
  postponed: ["confirmed", "no_answer", "cancelled", "pending_confirmation"],
  cancelled: ["pending_confirmation"],
  ready_to_ship: ["shipped", "confirmed", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "delivery_failed", "returned"],
  out_for_delivery: ["delivered", "delivery_failed", "returned"],
  delivered: ["returned", "refunded"],
  delivery_failed: ["out_for_delivery", "shipped", "delivered", "returned"],
  returned: ["return_received"],
  return_received: ["refunded", "ready_to_ship"],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses during which the order's stock is reserved (decremented). */
const RESERVING: ReadonlySet<OrderStatus> = new Set(["confirmed", "ready_to_ship", "shipped", "out_for_delivery", "delivered", "delivery_failed"]);
export const reservesStock = (s: OrderStatus) => RESERVING.has(s);

/** What to do with stock when moving between statuses. */
export function stockAction(wasReserved: boolean, to: OrderStatus): "reserve" | "release" | "none" {
  const should = reservesStock(to);
  if (should && !wasReserved) return "reserve";
  if (!should && wasReserved) return "release";
  return "none";
}

/** Terminal-or-closed statuses where an order no longer needs agent action. */
export const CLOSED: ReadonlySet<OrderStatus> = new Set(["delivered", "cancelled", "return_received", "refunded"]);
/** Statuses in which an order is "in the carrier's hands" (cash expected from carrier). */
export const WITH_CARRIER: ReadonlySet<OrderStatus> = new Set(["shipped", "out_for_delivery", "delivery_failed"]);

export const customerTimeline: OrderStatus[] = ["new", "confirmed", "ready_to_ship", "shipped", "out_for_delivery", "delivered"];
