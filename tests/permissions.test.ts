import { describe, expect, it } from "vitest";
import { can, canSetStatus, homeFor, ROLES } from "@/lib/permissions";

describe("roles", () => {
  it("owner and manager can set any status; confirmer and packer only their own", () => {
    expect(canSetStatus("owner", "shipped")).toBe(true);
    expect(canSetStatus("staff", "cancelled")).toBe(true);
    expect(canSetStatus("confirmer", "confirmed")).toBe(true);
    expect(canSetStatus("confirmer", "shipped")).toBe(false);
    expect(canSetStatus("packer", "shipped")).toBe(true);
    expect(canSetStatus("packer", "confirmed")).toBe(false);
    expect(canSetStatus("accountant", "confirmed")).toBe(false);
  });
  it("keeps money away from confirmers and orders read-only for accountants", () => {
    expect(can("confirmer", "cash.manage")).toBe(false);
    expect(can("confirmer", "dashboard.view")).toBe(false);
    expect(can("accountant", "cash.manage")).toBe(true);
    expect(can("accountant", "orders.confirm")).toBe(false);
    expect(can("packer", "customers.view")).toBe(false);
    expect(can("staff", "coupons.manage")).toBe(true);
  });
  it("sends every role somewhere it can open", () => {
    for (const r of ROLES) expect(["/admin", "/admin/orders", "/admin/team/account"]).toContain(homeFor(r));
    expect(homeFor("confirmer")).toBe("/admin/orders");
  });
});
