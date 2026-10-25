import type { CsvDefinition, ShipOrder } from "./types";

const NUMERIC = /^-?\d+(\.\d+)?$/;

/** Escape one CSV cell. Neutralises spreadsheet formula injection (=,+,-,@) for non-numeric text. */
export function csvCell(v: string, delimiter: string): string {
  let s = v.replace(/\r\n|\r|\n/g, " ").trim();
  if (/^[=+\-@\t]/.test(s) && !NUMERIC.test(s)) s = `'${s}`;
  return s.includes(delimiter) || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(def: CsvDefinition, orders: ShipOrder[]): string {
  const d = def.delimiter;
  const lines = [def.columns.map((c) => csvCell(c.header, d)).join(d), ...orders.map((o) => def.columns.map((c) => csvCell(c.value(o), d)).join(d))];
  return (def.bom ? "﻿" : "") + lines.join("\r\n") + "\r\n";
}

/** Minor units -> plain decimal string ("199.00") for the given decimals; no floats. */
export function amount(minor: number, decimals: number): string {
  const neg = minor < 0;
  const abs = Math.abs(Math.trunc(minor));
  if (decimals === 0) return `${neg ? "-" : ""}${abs}`;
  const p = 10 ** decimals;
  return `${neg ? "-" : ""}${Math.floor(abs / p)}.${String(abs % p).padStart(decimals, "0")}`;
}

export const itemsText = (o: ShipOrder) => o.items.map((i) => `${i.qty}x ${i.name}${i.variantName ? ` (${i.variantName})` : ""}`).join(" + ");
export const itemsQty = (o: ShipOrder) => o.items.reduce((n, i) => n + i.qty, 0);
export const csvFilename = (carrierId: string, now = new Date()) => `${carrierId}-orders-${now.toISOString().slice(0, 10)}.csv`;
