# Carriers

## Honest status (read this first)

The build environment could only reach the open web through a search tool and an allow-listed fetcher. Every carrier
documentation host I tried (`developer.aramex.com`, `www.aramex.com`, `docs.sendit.ma`, `developer.dhl.com`, wordpress.org
plugin pages) was blocked (`ENOTFOUND` / proxy 403). Web search returned **no official API documentation** for any of the 15
carriers (only third-party plugin listings and, for Aramex, a search snippet saying the Shipping Services API is a SOAP/WSDL
service at `ws.aramex.net` whose manual is a PDF I could not open).

Therefore, following the rule "do not guess endpoints", **no live API is implemented. All 15 carriers are `hasApi: false`
(export-only)**. Nothing here has been run against a real carrier account; nothing is claimed as tested.

| Carrier | Category | Docs / source consulted | Not verified |
|---|---|---|---|
| ozone-express | export-only | none found | API existence, CSV template |
| sendit | export-only | search: sendit.ma has an API (Odoo/WooCommerce/Shopify connectors exist, contact technique@sendit.ma); docs not reachable | endpoints, auth, webhook format, CSV template |
| onessta | export-only | none found | all |
| amana (Poste Maroc) | export-only | none found | all |
| cathedis | export-only | none found (only aggregator mentions) | all |
| livo | export-only | none found | all |
| digylog | export-only | none found | all |
| forcelog | export-only | none found | all |
| speedex | export-only | none found | all |
| kingexpress | export-only | none found | all |
| chronopost | export-only | none found | all |
| aramex | export-only | https://www.aramex.com/ae/en/developers-solution-center/aramex-apis and https://www.aramex.com/docs/default-source/resourses/resourcesdata/shipping-services-api-manual.pdf (search results only; page bodies not readable). Appears to be SOAP (`ws.aramex.net`, ShippingAPI.V2 `CreateShipments`) | request/response schema, auth, JSON availability |
| smsa | export-only | none found | all |
| jt | export-only | none found | all |
| naqel | export-only | none found | all |

## What export-only does

- `exportCarrierCsv(carrierId, orderIds)` produces a CSV in a **generic COD template, format unverified** (`csv.verified=false`):
  Order number; Recipient name; Phone; City; Carrier city ID; Address; COD amount; Currency; Products; Quantity; Comment.
  `;` delimiter, UTF-8 BOM, CRLF, formula-injection neutralised. The real import template of each carrier was not
  available; rename/reorder headers to match your carrier before uploading.
- `setManualTracking()` stores the tracking number and moves `ready_to_ship` -> `shipped`.
- Customer-facing tracking links come from `tracking-url.ts` (Amana, Chronopost, Aramex, SMSA, J&T, Naqel; those URL
  patterns were pre-existing and are also unverified).

## Adding a live API later

1. Read the carrier's official docs; fill in `src/features/shipping/carriers/<id>/index.ts` with a full `CarrierAdapter`
   (`hasApi: true`, `credentialFields`, `createShipment`, `getTracking`, `statusMap`, `testConnection`, optional
   `listCities` / `webhookHandler`), replacing `exportOnlyCarrier(...)`.
2. Use `fetchWithRetry` for idempotent GETs. For `createShipment` do not retry inside the adapter: `sendOrdersToCarrier`
   already wraps it in `retryAsync` (retries only `CarrierHttpError{retryable}`: 5xx/429/timeouts/network).
3. Webhooks must verify authenticity and throw `WebhookAuthError`; the route `/api/carriers/<id>/webhook` is
   rate-limited, requires the carrier to be enabled, and applies updates idempotently.
4. Document the docs URL here and mark it "API integrated (verified from docs)" only if actually run against an account.

The framework paths (send, label to R2, tracking sync, webhook, cron) are implemented but, with no API adapter, are only
exercised via unit tests of the retry logic; the DB-backed flows were not run end to end.

## Security notes

- Credentials: AES-GCM (`encryptJson`) keyed by `SECRETS_KEY` or the install secret, stored in `carriers.credentials`;
  the UI only receives `configured` + a masked tail (2 chars) of secret fields; owner-only server actions.
- Labels: R2 `labels/<orderNumber>.pdf`, served only to signed-in admins at `/api/carriers/labels/<number>` (`private, no-store`).
- Cron `/api/cron/sync-tracking`: accepts `x-cron: 1` with host `internal`, or an admin session. Also purges rate limits.
