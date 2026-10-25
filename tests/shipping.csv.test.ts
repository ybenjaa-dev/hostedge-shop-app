import { describe, expect, it } from "vitest";
import { amount, buildCsv, csvCell, csvFilename } from "@/features/shipping/csv";
import { GENERIC_COD_CSV } from "@/features/shipping/carriers/generic";
import type { ShipOrder } from "@/features/shipping/types";

const order: ShipOrder = {
  id: "1", number: "1001", name: '=cmd|"x"', phone: "212600000000", country: "MA", city: "Fès", cityId: "c", carrierCityId: "42",
  address: "12 rue, étage 2\nporte 3", notes: null, currency: "MAD", decimals: 2, codAmount: 19950,
  items: [{ name: "Lamp", variantName: "Red", sku: null, qty: 2 }, { name: "Cable", variantName: null, sku: null, qty: 1 }], createdAt: 0,
};

describe("shipping csv", () => {
  it("formats minor units without floats", () => {
    expect(amount(19950, 2)).toBe("199.50");
    expect(amount(5, 2)).toBe("0.05");
    expect(amount(1005, 3)).toBe("1.005");
    expect(amount(100, 0)).toBe("100");
  });
  it("escapes delimiters, quotes, newlines and formula injection", () => {
    expect(csvCell("a;b", ";")).toBe('"a;b"');
    expect(csvCell('say "hi"', ";")).toBe('"say ""hi"""');
    expect(csvCell("x\ny", ",")).toBe("x y");
    expect(csvCell("=1+1", ";")).toBe("'=1+1");
    expect(csvCell("-12.5", ";")).toBe("-12.5");
  });
  it("builds header + rows with BOM and CRLF", () => {
    const csv = buildCsv(GENERIC_COD_CSV, [order]);
    expect(csv.startsWith("﻿Order number;Recipient name;Phone")).toBe(true);
    const [, row] = csv.split("\r\n");
    expect(row).toContain("199.50;MAD;2x Lamp (Red) + 1x Cable;3");
    expect(row).toContain("'=cmd|"); // neutralised
    expect(row).toContain(";42;"); // carrier city id
    expect(row).not.toContain("\n");
  });
  it("names files per carrier and date", () => {
    expect(csvFilename("sendit", new Date("2026-01-02T10:00:00Z"))).toBe("sendit-orders-2026-01-02.csv");
  });
  it("generic template is flagged unverified", () => {
    expect(GENERIC_COD_CSV.verified).toBe(false);
  });
});
