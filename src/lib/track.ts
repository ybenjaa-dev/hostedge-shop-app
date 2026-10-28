"use client";
type W = Window & { fbq?: (...a: unknown[]) => void; ttq?: { track: (...a: unknown[]) => void }; gtag?: (...a: unknown[]) => void; snaptr?: (...a: unknown[]) => void };

/** Fire ecommerce events on every configured pixel. No-ops if a pixel isn't loaded. */
export function track(event: "InitiateCheckout" | "Purchase" | "Lead" | "ViewContent" | "AddToCart", data: { value?: number; currency?: string; ids?: string[]; eventId?: string } = {}) {
  const w = window as W;
  const value = data.value;
  try {
    w.fbq?.("track", event, { value, currency: data.currency, content_ids: data.ids, content_type: "product" }, data.eventId ? { eventID: data.eventId } : undefined);
    const tt = { InitiateCheckout: "InitiateCheckout", Purchase: "PlaceAnOrder", Lead: "SubmitForm", ViewContent: "ViewContent", AddToCart: "AddToCart" }[event];
    w.ttq?.track(tt, { value, currency: data.currency, contents: data.ids?.map((id) => ({ content_id: id })) });
    const ga = { InitiateCheckout: "begin_checkout", Purchase: "purchase", Lead: "generate_lead", ViewContent: "view_item", AddToCart: "add_to_cart" }[event];
    w.gtag?.("event", ga, { value, currency: data.currency, transaction_id: data.eventId });
    const sn = { InitiateCheckout: "START_CHECKOUT", Purchase: "PURCHASE", Lead: "SIGN_UP", ViewContent: "VIEW_CONTENT", AddToCart: "ADD_CART" }[event];
    w.snaptr?.("track", sn, { price: value != null && data.currency ? value : undefined, currency: data.currency, transaction_id: data.eventId });
  } catch {}
}

const cookie = (n: string) => document.cookie.split("; ").find((c) => c.startsWith(`${n}=`))?.slice(n.length + 1) ?? "";

/**
 * Ad-click context the server needs to match a later "confirmed/delivered" event back to the ad click:
 * the pixel cookies (_fbp, _fbc, _ttp) and the click ids from the landing URL (fbclid, ttclid), remembered for 90 days.
 */
export function trackingContext(): { fbp?: string; fbc?: string; ttp?: string; ttclid?: string; fp?: string; url: string } {
  const out: { fbp?: string; fbc?: string; ttp?: string; ttclid?: string; fp?: string; url: string } = { url: location.href.slice(0, 500) };
  try {
    const q = new URLSearchParams(location.search);
    const saved = JSON.parse(localStorage.getItem("he_clk") ?? "{}") as { fbc?: string; ttclid?: string; at?: number };
    const fresh = saved.at && Date.now() - saved.at < 90 * 864e5 ? saved : {};
    const fbclid = q.get("fbclid"), ttclid = q.get("ttclid");
    const next = { fbc: fbclid ? `fb.1.${Date.now()}.${fbclid}` : fresh.fbc, ttclid: ttclid ?? fresh.ttclid, at: fbclid || ttclid ? Date.now() : fresh.at };
    if (fbclid || ttclid) localStorage.setItem("he_clk", JSON.stringify(next));
    out.fbp = cookie("_fbp") || undefined; out.fbc = cookie("_fbc") || next.fbc || undefined; out.ttp = cookie("_ttp") || undefined; out.ttclid = next.ttclid || undefined;
    out.fp = localStorage.getItem("he_fp") || undefined; // set only after the visitor accepted the privacy notice
  } catch { /* storage blocked */ }
  return out;
}
