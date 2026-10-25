"use client";
type W = Window & { fbq?: (...a: unknown[]) => void; ttq?: { track: (...a: unknown[]) => void }; gtag?: (...a: unknown[]) => void; snaptr?: (...a: unknown[]) => void };

/** Fire ecommerce events on every configured pixel. No-ops if a pixel isn't loaded. */
export function track(event: "InitiateCheckout" | "Purchase" | "ViewContent" | "AddToCart", data: { value?: number; currency?: string; ids?: string[]; eventId?: string } = {}) {
  const w = window as W;
  const value = data.value;
  try {
    w.fbq?.("track", event, { value, currency: data.currency, content_ids: data.ids, content_type: "product" }, data.eventId ? { eventID: data.eventId } : undefined);
    const tt = { InitiateCheckout: "InitiateCheckout", Purchase: "PlaceAnOrder", ViewContent: "ViewContent", AddToCart: "AddToCart" }[event];
    w.ttq?.track(tt, { value, currency: data.currency, contents: data.ids?.map((id) => ({ content_id: id })) });
    const ga = { InitiateCheckout: "begin_checkout", Purchase: "purchase", ViewContent: "view_item", AddToCart: "add_to_cart" }[event];
    w.gtag?.("event", ga, { value, currency: data.currency, transaction_id: data.eventId });
    const sn = { InitiateCheckout: "START_CHECKOUT", Purchase: "PURCHASE", ViewContent: "VIEW_CONTENT", AddToCart: "ADD_CART" }[event];
    w.snaptr?.("track", sn, { price: value != null && data.currency ? value : undefined, currency: data.currency, transaction_id: data.eventId });
  } catch {}
}
