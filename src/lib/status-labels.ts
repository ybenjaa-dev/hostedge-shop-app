import { DEFAULT_STATUS_DEFS, isStatus, type OrderStatus } from "./order-status";
import type { Settings } from "./settings";
import type { Lang } from "./i18n-core";

export function statusInfo(settings: Pick<Settings, "statuses">, status: string, lang: Lang): { label: string; color: string } {
  if (!isStatus(status)) return { label: status, color: "#64748b" };
  const base = DEFAULT_STATUS_DEFS[status];
  const o = settings.statuses[status as OrderStatus];
  return { label: (o?.label as Record<string, string> | undefined)?.[lang] || o?.label?.en || (base.label as Record<string, string>)[lang] || base.label.en, color: o?.color || base.color };
}
