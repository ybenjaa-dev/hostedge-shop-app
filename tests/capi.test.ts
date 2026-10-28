import { describe, expect, it } from "vitest";
import { browserEvent, metaEvent, planEvents, tiktokEvent, tooOld, type OrderCtx } from "@/features/tracking/capi-core";

const both = { meta: true, tiktok: true };
const ctx: OrderCtx = { number: "1042", total: 24900, currency: "MAD", decimals: 2, phone: "212661234567", name: "Sara El Amrani", city: "Casablanca", country: "MA", customerId: "c1", ip: "1.2.3.4", ua: "UA", url: "https://shop.test/p/x", fbp: "fb.1.1.2", fbc: "fb.1.1.abc", ttp: "tt1", ttclid: "cl1", items: [{ id: "p1", qty: 2, price: 12450 }] };

describe("planEvents", () => {
  it("placed → Purchase on both platforms, same id as the browser event", () => {
    expect(planEvents("placed", "1042", "placed", false, both)).toEqual([{ platform: "meta", name: "Purchase", id: "1042" }, { platform: "tiktok", name: "PlaceAnOrder", id: "1042" }]);
    expect(browserEvent("placed")).toBe("Purchase");
  });
  it("delayed purchase: a Lead at checkout, the Purchase when confirmed / delivered", () => {
    expect(planEvents("placed", "1042", "confirmed", false, both).map((e) => e.name)).toEqual(["Lead", "SubmitForm"]);
    expect(browserEvent("delivered")).toBe("Lead");
    expect(planEvents("confirmed", "1042", "confirmed", false, both).map((e) => e.name)).toEqual(["Purchase", "CompletePayment"]);
    expect(planEvents("delivered", "1042", "confirmed", false, both)).toEqual([]);
    expect(planEvents("delivered", "1042", "delivered", false, { meta: true, tiktok: false })).toEqual([{ platform: "meta", name: "Purchase", id: "1042" }]);
  });
  it("status events are opt-in and carry their own ids", () => {
    expect(planEvents("confirmed", "1042", "placed", true, { meta: true, tiktok: false })).toEqual([{ platform: "meta", name: "OrderConfirmed", id: "1042-confirmed" }]);
    expect(planEvents("returned", "1042", "placed", false, both)).toEqual([]);
    expect(planEvents("returned", "1042", "placed", true, { meta: true, tiktok: false })[0]?.name).toBe("OrderReturned");
  });
  it("skips platforms that are not configured", () => { expect(planEvents("placed", "1", "placed", false, { meta: false, tiktok: false })).toEqual([]); });
});

describe("payloads", () => {
  it("hashes personal data for Meta and keeps ids / value in major units", async () => {
    const e = await metaEvent({ platform: "meta", name: "Purchase", id: "1042" }, ctx, 1700000000);
    expect(e.event_id).toBe("1042");
    expect(e.custom_data.value).toBe(249);
    expect(e.custom_data.num_items).toBe(2);
    expect((e.user_data as Record<string, string[]>).ph?.[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(e)).not.toContain("212661234567");
    expect(JSON.stringify(e)).not.toContain("Sara");
    expect(e.user_data.fbp).toBe("fb.1.1.2");
    expect(e.user_data.client_ip_address).toBe("1.2.3.4");
  });
  it("builds a TikTok event with a hashed +E.164 phone", async () => {
    const b = await tiktokEvent({ platform: "tiktok", name: "PlaceAnOrder", id: "1042" }, ctx, 1700000000, "PIX123", "TEST1");
    expect(b.event_source_id).toBe("PIX123");
    expect(b.test_event_code).toBe("TEST1");
    expect(b.data[0]!.user.phone).toMatch(/^[a-f0-9]{64}$/);
    expect(b.data[0]!.properties.value).toBe(249);
    expect(b.data[0]!.user.ttclid).toBe("cl1");
  });
  it("flags events older than ~7 days", () => { expect(tooOld(Date.now() - 8 * 864e5)).toBe(true); expect(tooOld(Date.now() - 1 * 864e5)).toBe(false); });
});
