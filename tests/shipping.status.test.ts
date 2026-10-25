import { describe, expect, it } from "vitest";
import { GENERIC_STATUS_MAP, mapCarrierStatus, normStatus } from "@/features/shipping/status";
import { ADAPTERS, getAdapter } from "@/features/shipping/registry";
import { isStatus } from "@/lib/order-status";

describe("carrier status mapping", () => {
  it("normalises case, accents and separators", () => {
    expect(normStatus("  Livré ")).toBe("livre");
    expect(normStatus("Out_For-Delivery")).toBe("out for delivery");
  });
  it("maps known words and returns null for unknown", () => {
    expect(mapCarrierStatus(GENERIC_STATUS_MAP, "Out For Delivery")).toBe("out_for_delivery");
    expect(mapCarrierStatus(GENERIC_STATUS_MAP, "Livrée")).toBe("delivered");
    expect(mapCarrierStatus(GENERIC_STATUS_MAP, "weird")).toBeNull();
    expect(mapCarrierStatus(GENERIC_STATUS_MAP, "")).toBeNull();
  });
  it("registry has 15 unique carriers whose maps only use valid statuses", () => {
    expect(ADAPTERS).toHaveLength(15);
    expect(new Set(ADAPTERS.map((a) => a.id)).size).toBe(15);
    for (const a of ADAPTERS) {
      expect(getAdapter(a.id)).toBe(a);
      for (const v of Object.values(a.statusMap)) expect(isStatus(v)).toBe(true);
      if (!a.hasApi) expect(a.createShipment).toBeUndefined(); // no fake API surface
    }
  });
});
