/** Public tracking page per carrier (customer-facing "follow on carrier website" link). Filled by carrier adapters. */
export const TRACKING_URLS: Record<string, (n: string) => string> = {
  amana: (n) => `https://www.poste.ma/suivi?n=${encodeURIComponent(n)}`,
  chronopost: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${encodeURIComponent(n)}`,
  aramex: (n) => `https://www.aramex.com/track/results?ShipmentNumber=${encodeURIComponent(n)}`,
  smsa: (n) => `https://www.smsaexpress.com/track/?tracknumbers=${encodeURIComponent(n)}`,
  jt: (n) => `https://www.jtexpress.ae/track?billcode=${encodeURIComponent(n)}`,
  naqel: (n) => `https://www.naqelexpress.com/en/tracking/?waybill=${encodeURIComponent(n)}`,
};
export const trackingUrl = (carrierId: string | null, n: string | null) => (carrierId && n && TRACKING_URLS[carrierId] ? TRACKING_URLS[carrierId]!(n) : null);
