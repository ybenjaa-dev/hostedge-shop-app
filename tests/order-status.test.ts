import { describe, expect, it } from "vitest";
import { ORDER_STATUSES, TRANSITIONS, canTransition, stockAction } from "@/lib/order-status";

describe("order status machine", () => {
  it("every transition target is a valid status", () => {
    for (const [from, tos] of Object.entries(TRANSITIONS)) {
      expect(ORDER_STATUSES).toContain(from);
      for (const t of tos) expect(ORDER_STATUSES).toContain(t);
    }
  });
  it("allows the happy COD path", () => {
    const path = ["new", "pending_confirmation", "confirmed", "ready_to_ship", "shipped", "out_for_delivery", "delivered"] as const;
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i]!, path[i + 1]!)).toBe(true);
  });
  it("blocks illegal jumps", () => {
    expect(canTransition("new", "delivered")).toBe(false);
    expect(canTransition("refunded", "new")).toBe(false);
    expect(canTransition("delivered", "confirmed")).toBe(false);
  });
  it("reserves on confirm and releases on cancel/return", () => {
    expect(stockAction(false, "confirmed")).toBe("reserve");
    expect(stockAction(true, "shipped")).toBe("none");
    expect(stockAction(true, "cancelled")).toBe("release");
    expect(stockAction(true, "returned")).toBe("release");
    expect(stockAction(false, "cancelled")).toBe("none");
  });
});
