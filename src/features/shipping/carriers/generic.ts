import type { CarrierAdapter, CsvDefinition } from "../types";
import { GENERIC_STATUS_MAP } from "../status";
import { amount, itemsQty, itemsText } from "../csv";

/**
 * Generic COD bulk-import template. FORMAT UNVERIFIED for every carrier using it:
 * no carrier's official import template could be read (docs hosts blocked from the build environment).
 * Columns cover what every COD courier needs; the merchant may need to rename/reorder headers to match
 * the carrier's own template.
 */
export const GENERIC_COD_CSV: CsvDefinition = {
  delimiter: ";",
  bom: true,
  verified: false,
  columns: [
    { header: "Order number", value: (o) => o.number },
    { header: "Recipient name", value: (o) => o.name },
    { header: "Phone", value: (o) => o.phone },
    { header: "City", value: (o) => o.city },
    { header: "Carrier city ID", value: (o) => o.carrierCityId ?? "" },
    { header: "Address", value: (o) => o.address },
    { header: "COD amount", value: (o) => amount(o.codAmount, o.decimals) },
    { header: "Currency", value: (o) => o.currency },
    { header: "Products", value: itemsText },
    { header: "Quantity", value: (o) => String(itemsQty(o)) },
    { header: "Comment", value: (o) => o.notes ?? "" },
  ],
};

/** Export-only adapter: CSV in a generic COD template + manual tracking number entry. No network calls. */
export function exportOnlyCarrier(meta: { id: string; name: string; countries: string[]; docsUrl?: string }): CarrierAdapter {
  return {
    id: meta.id,
    name: meta.name,
    countries: meta.countries,
    hasApi: false,
    credentialFields: [],
    docsUrl: meta.docsUrl ?? "",
    csv: GENERIC_COD_CSV,
    statusMap: GENERIC_STATUS_MAP,
    async testConnection() {
      return { ok: false, message: `${meta.name} is export-only in this build (no verified public API). Export a CSV and enter tracking numbers manually.` };
    },
  };
}
