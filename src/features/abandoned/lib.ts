/** Pure helpers for the abandoned-checkout CRM (status flow, cart lines, filters, CSV). No server imports so tests can load it. */
import { csvCell } from "@/lib/csv";
import { toMajorString } from "@/lib/money";
import { tr } from "@/lib/i18n-core";

export const ABANDONED_STATUSES = ["new", "contacted", "converted", "dismissed"] as const;
export type AbandonedStatus = (typeof ABANDONED_STATUSES)[number];
export const isAbandonedStatus = (s: unknown): s is AbandonedStatus => typeof s === "string" && (ABANDONED_STATUSES as readonly string[]).includes(s);

export const STATUS_META: Record<AbandonedStatus, { label: string; color: string }> = {
  new: { label: "New", color: "#2563eb" },
  contacted: { label: "Contacted", color: "#d97706" },
  converted: { label: "Converted", color: "#16a34a" },
  dismissed: { label: "Dismissed", color: "#64748b" },
};

const FLOW: Record<AbandonedStatus, readonly AbandonedStatus[]> = {
  new: ["contacted", "converted", "dismissed"],
  contacted: ["contacted", "converted", "dismissed"],
  converted: [],
  dismissed: ["new", "contacted"],
};
export const canTransition = (from: AbandonedStatus, to: AbandonedStatus): boolean => FLOW[from].includes(to);

/** Where a dismissed row goes on Restore: back to 'contacted' if the team already reached out, otherwise 'new'. */
export const restoreTarget = (contactedCount: number): AbandonedStatus => (contactedCount > 0 ? "contacted" : "new");

/** Legacy `recovered` column mirrors `converted`. */
export const recoveredFlag = (s: AbandonedStatus): 0 | 1 => (s === "converted" ? 1 : 0);

export type AbandonedLine = { productId: string; variantId: string | null; name: string; variantName: string | null; qty: number; unitPrice: number };

/** Tolerant parser for the stored `lines` JSON (and for client input): drops malformed entries, clamps numbers. */
export function parseLines(raw: unknown): AbandonedLine[] {
  let v = raw;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (!Array.isArray(v)) return [];
  const out: AbandonedLine[] = [];
  for (const x of v.slice(0, 30)) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const productId = typeof o.productId === "string" ? o.productId.slice(0, 40) : "";
    if (!productId) continue;
    const qty = Math.min(99, Math.max(1, Math.trunc(Number(o.qty) || 1)));
    const price = Math.trunc(Number(o.unitPrice));
    out.push({
      productId,
      variantId: typeof o.variantId === "string" && o.variantId ? o.variantId.slice(0, 40) : null,
      name: typeof o.name === "string" ? o.name.slice(0, 200) : "",
      variantName: typeof o.variantName === "string" && o.variantName ? o.variantName.slice(0, 120) : null,
      qty,
      unitPrice: Number.isFinite(price) && price >= 0 ? price : 0,
    });
  }
  return out;
}

export const linesQty = (l: AbandonedLine[]) => l.reduce((a, x) => a + x.qty, 0);
export const linesSubtotal = (l: AbandonedLine[]) => l.reduce((a, x) => a + x.qty * x.unitPrice, 0);
export const lineLabel = (l: AbandonedLine) => `${tr(l.name, "en", "fr")}${l.variantName ? ` (${tr(l.variantName, "en", "fr")})` : ""}`;
export const linesSummary = (l: AbandonedLine[], sep = " | ") => l.map((x) => `${x.qty}x ${lineLabel(x)}`).join(sep);

/** Coarse device class from a user-agent string. */
export function deviceClass(ua: string | null | undefined): "mobile" | "desktop" | "tablet" | null {
  if (!ua) return null;
  if (/iPad|Tablet|PlayBook|Silk/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) return "tablet";
  return /Mobi|iPhone|iPod|Android/.test(ua) ? "mobile" : "desktop";
}

/** Short label for where the visitor came from: utm_source > click id > referrer host. */
export function sourceLabel(x: { utmSource?: string; fbclid?: boolean; ttclid?: boolean; referrer?: string }): string | null {
  if (x.utmSource) return x.utmSource.slice(0, 60);
  if (x.fbclid) return "facebook";
  if (x.ttclid) return "tiktok";
  if (x.referrer) {
    try { return new URL(x.referrer).hostname.replace(/^www\./, "").slice(0, 60); } catch { return null; }
  }
  return "direct";
}

export type AbandonedFilters = { status?: string; q?: string; city?: string; from?: string; to?: string };
const dayStart = (s: string) => { const d = Date.parse(`${s}T00:00:00Z`); return Number.isFinite(d) ? d : null; };

/** WHERE for the list, counts and export. `ignoreStatus` is used for the tab counts. */
export function buildAbandonedWhere(f: AbandonedFilters, ignoreStatus = false): { where: string; args: unknown[] } {
  const w: string[] = [];
  const a: unknown[] = [];
  if (!ignoreStatus && isAbandonedStatus(f.status)) { w.push("status = ?"); a.push(f.status); }
  if (f.city) { w.push("city = ?"); a.push(f.city); }
  const from = f.from ? dayStart(f.from) : null;
  const to = f.to ? dayStart(f.to) : null;
  if (from) { w.push("updated_at >= ?"); a.push(from); }
  if (to) { w.push("updated_at < ?"); a.push(to + 86400_000); }
  const q = f.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
    const parts = ["name LIKE ? ESCAPE '\\'", "product_name LIKE ? ESCAPE '\\'", "lines LIKE ? ESCAPE '\\'"];
    a.push(like, like, like);
    if (digits.length >= 4) { parts.push("phone LIKE ?"); a.push(`%${digits.replace(/^0+/, "")}%`); }
    w.push(`(${parts.join(" OR ")})`);
  }
  return { where: w.length ? `WHERE ${w.join(" AND ")}` : "", args: a };
}

export type AbandonedExportRow = {
  name: string | null; phone: string | null; city: string | null; address: string | null; lines: string | null; productName: string | null;
  total: number | null; currency: string | null; status: string; note: string | null; contactedAt: number | null; contactedCount: number;
  coupon: string | null; source: string | null; device: string | null; lang: string | null; convertedOrderId: string | null;
  createdAt: number; updatedAt: number;
};
export const EXPORT_HEAD = ["Name", "Phone", "City", "Address", "Products", "Qty", "Total", "Currency", "Status", "Note", "Contacted at", "Contacted count", "Coupon", "Source", "Device", "Language", "Converted order", "Created", "Updated"];

const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : "");
/** Phones are digits only, so the leading '+' is safe and must not get the formula-guard apostrophe. */
const cell = (v: unknown) => (typeof v === "string" && /^\+\d{6,16}$/.test(v) ? v : csvCell(v));

export function exportCells(r: AbandonedExportRow, fallbackCurrency = "MAD"): string[] {
  const lines = parseLines(r.lines);
  const cur = r.currency || fallbackCurrency;
  return [
    r.name ?? "", r.phone ? `+${r.phone}` : "", r.city ?? "", r.address ?? "",
    lines.length ? linesSummary(lines) : tr(r.productName ?? "", "en", "fr"),
    String(lines.length ? linesQty(lines) : r.productName ? 1 : 0),
    r.total != null ? toMajorString(r.total, cur) : lines.length ? toMajorString(linesSubtotal(lines), cur) : "",
    cur, r.status, r.note ?? "", iso(r.contactedAt), String(r.contactedCount), r.coupon ?? "", r.source ?? "", r.device ?? "", r.lang ?? "",
    r.convertedOrderId ?? "", iso(r.createdAt), iso(r.updatedAt),
  ];
}
export function buildExportCsv(rows: AbandonedExportRow[], fallbackCurrency = "MAD"): string {
  const lines = [EXPORT_HEAD, ...rows.map((r) => exportCells(r, fallbackCurrency))].map((r) => r.map(cell).join(","));
  return "﻿" + lines.join("\r\n");
}
