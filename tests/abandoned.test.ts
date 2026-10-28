import { describe, expect, it } from "vitest";
import {
  buildAbandonedWhere, buildExportCsv, canTransition, deviceClass, exportCells, linesQty, linesSubtotal, linesSummary, parseLines, recoveredFlag, restoreTarget, sourceLabel, EXPORT_HEAD,
  type AbandonedExportRow,
} from "@/features/abandoned/lib";

const row = (o: Partial<AbandonedExportRow> = {}): AbandonedExportRow => ({
  name: "Sara", phone: "212612345678", city: "Casablanca", address: "Rue 1", productName: "Lamp", lines: JSON.stringify([{ productId: "p1", variantId: "v1", name: "Lamp", variantName: "Red", qty: 2, unitPrice: 15000 }]),
  total: 31000, currency: "MAD", status: "contacted", note: "call back", contactedAt: 1_700_000_000_000, contactedCount: 2, coupon: null, source: "facebook", device: "mobile", lang: "fr",
  convertedOrderId: null, createdAt: 1_700_000_000_000, updatedAt: 1_700_000_100_000, ...o,
});

describe("status flow", () => {
  it("allows the expected transitions", () => {
    expect(canTransition("new", "contacted")).toBe(true);
    expect(canTransition("contacted", "contacted")).toBe(true);
    expect(canTransition("new", "dismissed")).toBe(true);
    expect(canTransition("dismissed", "new")).toBe(true);
    expect(canTransition("converted", "dismissed")).toBe(false);
    expect(canTransition("converted", "new")).toBe(false);
    expect(canTransition("dismissed", "converted")).toBe(false);
  });
  it("restores to contacted only when someone reached out", () => {
    expect(restoreTarget(0)).toBe("new");
    expect(restoreTarget(3)).toBe("contacted");
  });
  it("keeps the legacy recovered flag in sync", () => {
    expect(recoveredFlag("converted")).toBe(1);
    for (const s of ["new", "contacted", "dismissed"] as const) expect(recoveredFlag(s)).toBe(0);
  });
});

describe("cart lines", () => {
  it("parses JSON, clamps and drops junk", () => {
    const l = parseLines(JSON.stringify([{ productId: "a", qty: 500, unitPrice: 1000, name: "X" }, { qty: 1 }, null, { productId: "b", qty: "x", unitPrice: -5, variantId: "" }]));
    expect(l).toHaveLength(2);
    expect(l[0]).toMatchObject({ productId: "a", qty: 99, unitPrice: 1000, variantId: null });
    expect(l[1]).toMatchObject({ productId: "b", qty: 1, unitPrice: 0 });
  });
  it("is safe on bad input", () => {
    expect(parseLines("not json")).toEqual([]);
    expect(parseLines(null)).toEqual([]);
    expect(parseLines({})).toEqual([]);
  });
  it("sums and summarises (i18n names flattened)", () => {
    const l = parseLines([{ productId: "a", qty: 2, unitPrice: 500, name: '{"en":"Lamp","fr":"Lampe"}', variantName: "Red" }, { productId: "b", qty: 1, unitPrice: 300, name: "Pen" }]);
    expect(linesQty(l)).toBe(3);
    expect(linesSubtotal(l)).toBe(1300);
    expect(linesSummary(l)).toBe("2x Lamp (Red) | 1x Pen");
  });
});

describe("device and source", () => {
  it("classifies coarse devices", () => {
    expect(deviceClass("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari")).toBe("mobile");
    expect(deviceClass("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe("desktop");
    expect(deviceClass("Mozilla/5.0 (Linux; Android 13; Tab)")).toBe("tablet");
    expect(deviceClass(null)).toBeNull();
  });
  it("labels the source", () => {
    expect(sourceLabel({ utmSource: "newsletter", fbclid: true })).toBe("newsletter");
    expect(sourceLabel({ fbclid: true })).toBe("facebook");
    expect(sourceLabel({ ttclid: true })).toBe("tiktok");
    expect(sourceLabel({ referrer: "https://www.google.com/search?q=x" })).toBe("google.com");
    expect(sourceLabel({})).toBe("direct");
  });
});

describe("filters", () => {
  it("builds no WHERE for an empty filter", () => {
    expect(buildAbandonedWhere({})).toEqual({ where: "", args: [] });
  });
  it("ignores unknown statuses and honours ignoreStatus", () => {
    expect(buildAbandonedWhere({ status: "bogus" }).where).toBe("");
    expect(buildAbandonedWhere({ status: "new" }).where).toContain("status = ?");
    expect(buildAbandonedWhere({ status: "new" }, true).where).toBe("");
  });
  it("combines status, city, dates and search with bound args", () => {
    const { where, args } = buildAbandonedWhere({ status: "new", city: "Rabat", from: "2025-01-01", to: "2025-01-02", q: "06 12 34" });
    expect(where).toMatch(/^WHERE status = \? AND city = \? AND updated_at >= \? AND updated_at < \? AND \(name LIKE/);
    expect(args.slice(0, 2)).toEqual(["new", "Rabat"]);
    expect(args[3]).toBe((args[2] as number) + 2 * 86400_000);
    expect(args).toContain("%61234%");
  });
  it("escapes LIKE wildcards", () => {
    expect(buildAbandonedWhere({ q: "50%_off" }).args[0]).toBe("%50\\%\\_off%");
  });
});

describe("CSV export", () => {
  it("maps every field", () => {
    const c = exportCells(row());
    expect(c).toHaveLength(EXPORT_HEAD.length);
    expect(c.slice(0, 9)).toEqual(["Sara", "+212612345678", "Casablanca", "Rue 1", "2x Lamp (Red)", "2", "310.00", "MAD", "contacted"]);
    expect(c[10]).toBe("2023-11-14T22:13:20.000Z");
  });
  it("falls back to legacy product columns", () => {
    const c = exportCells(row({ lines: null, total: null }));
    expect(c.slice(4, 7)).toEqual(["Lamp", "1", ""]);
  });
  it("keeps a plain +phone and neutralises formulas elsewhere", () => {
    const csv = buildExportCsv([row({ name: "=HYPERLINK(1)", note: 'say "hi", ok' })]);
    expect(csv.startsWith("﻿Name,Phone")).toBe(true);
    expect(csv).toContain(",+212612345678,");
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain('"say ""hi"", ok"');
  });
});
