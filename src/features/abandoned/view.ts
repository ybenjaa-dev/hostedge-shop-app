import { normalizePhone } from "@/lib/phone";
import { tr } from "@/lib/i18n-core";
import { fillTemplate } from "@/features/crm/template";
import type { Settings } from "@/lib/settings";
import type { AbandonedRow } from "./queries";
import { isAbandonedStatus, parseLines, linesSummary, type AbandonedLine, type AbandonedStatus } from "./lib";

export function rowE164(r: Pick<AbandonedRow, "phone">, country: string): string | null {
  if (!r.phone) return null;
  const n = normalizePhone(r.phone, country);
  return n.ok ? n.e164 : /^\d{8,15}$/.test(r.phone) ? r.phone : null;
}
export const rowStatus = (r: Pick<AbandonedRow, "status">): AbandonedStatus => (isAbandonedStatus(r.status) ? r.status : "new");

/** Stored cart lines, or a single line rebuilt from the legacy product columns. */
export function rowLines(r: Pick<AbandonedRow, "lines" | "productId" | "productName">): AbandonedLine[] {
  const l = parseLines(r.lines);
  if (l.length || !r.productId) return l;
  return [{ productId: r.productId, variantId: null, name: r.productName ?? "", variantName: null, qty: 1, unitPrice: 0 }];
}
export const rowProducts = (r: Pick<AbandonedRow, "lines" | "productId" | "productName">) => {
  const l = parseLines(r.lines);
  return l.length ? linesSummary(l, ", ") : tr(r.productName ?? "", "en", "fr");
};

export const followupMessage = (r: Pick<AbandonedRow, "name">, s: Settings) => fillTemplate(tr(s.templates.followup, s.store.defaultLang), { name: r.name ?? "", store: s.store.name });

export function ago(ms: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}
