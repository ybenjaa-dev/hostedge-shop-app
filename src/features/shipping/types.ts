import type { OrderStatus } from "@/lib/order-status";

/** Order data a carrier needs. Money is integer minor units; `codAmount` is what the courier collects. */
export type ShipOrder = {
  id: string;
  number: string;
  name: string;
  phone: string; // E.164 digits only
  country: string;
  city: string;
  cityId: string | null;
  /** Carrier-specific city id from carrier_cities (null when unmapped). */
  carrierCityId: string | null;
  address: string;
  notes: string | null;
  currency: string;
  /** Decimals of `currency` (0/2/3). */
  decimals: number;
  codAmount: number;
  items: { name: string; variantName: string | null; sku: string | null; qty: number }[];
  createdAt: number;
};

export type CredentialField = { key: string; label: string; secret: boolean; hint?: string };
export type Credentials = Record<string, string>;

export type TrackingEvent = { at: number | null; status: string; message?: string; location?: string };
export type TrackingResult = {
  /** Raw carrier status string. */
  status: string;
  mapped: OrderStatus | null;
  events: TrackingEvent[];
  /** Minor units, when the carrier reports them. */
  cashCollected?: number;
  carrierFee?: number;
  remitted?: boolean;
};

export type ShipmentResult = {
  trackingNumber: string;
  labelUrl?: string;
  labelPdf?: ArrayBuffer;
  raw: unknown;
};

export type WebhookUpdate = {
  trackingNumber: string;
  status: string;
  mapped: OrderStatus | null;
  cashCollected?: number;
  carrierFee?: number;
  remitted?: boolean;
};

export type CsvColumn = { header: string; value: (o: ShipOrder) => string };
export type CsvDefinition = {
  columns: CsvColumn[];
  delimiter: "," | ";";
  /** Prepend UTF-8 BOM so Excel opens Arabic/French text correctly. */
  bom: boolean;
  /** true only when the column list was checked against the carrier's own template. */
  verified: boolean;
};

export type CarrierConfig = Record<string, unknown>;

export interface CarrierAdapter {
  id: string;
  name: string;
  countries: string[]; // ISO-2
  /** true ONLY when a live API was implemented from official docs that were actually read. */
  hasApi: boolean;
  credentialFields: CredentialField[];
  docsUrl: string;
  csv: CsvDefinition;
  /** carrier raw status (normalised lower-case) -> our status */
  statusMap: Record<string, OrderStatus>;

  // API operations (present only when hasApi)
  createShipment?(order: ShipOrder, creds: Credentials, cfg: CarrierConfig): Promise<ShipmentResult>;
  getTracking?(trackingNumber: string, creds: Credentials): Promise<TrackingResult>;
  cancelShipment?(trackingNumber: string, creds: Credentials): Promise<void>;
  getLabel?(trackingNumber: string, creds: Credentials): Promise<{ labelUrl?: string; labelPdf?: ArrayBuffer }>;
  listCities?(creds: Credentials): Promise<{ id: string; name: string }[]>;
  /** Must verify authenticity itself and throw WebhookAuthError when invalid. */
  webhookHandler?(req: Request, creds: Credentials): Promise<WebhookUpdate[]>;
  testConnection(creds: Credentials): Promise<{ ok: boolean; message: string }>;
}

export class WebhookAuthError extends Error {}
export class CarrierHttpError extends Error {
  constructor(message: string, public status: number | null, public retryable: boolean) {
    super(message);
  }
}
