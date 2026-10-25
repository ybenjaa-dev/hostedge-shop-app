# HostEdge Shop — a COD-first online store

A production-oriented e-commerce store with a full admin panel for sellers in **Morocco, Africa and the GCC** who sell mostly by **Cash on Delivery (COD)**.

- Next.js 16 (App Router, Server Components, Server Actions) · strict TypeScript · Tailwind CSS 4
- Runs on **HostEdge** (Cloudflare Workers via OpenNext) — no Node-only APIs, no filesystem writes
- **Database:** HostEdge SQL database (Cloudflare D1) → `env.DB`, Drizzle ORM, SQL migrations in `/migrations`
- **File storage:** HostEdge file storage (R2) → `env.FILES`
- Arabic (RTL) · French · English; MAD, SAR, AED, KWD, QAR, BHD, OMR, EUR, USD (+ a few African currencies)

---

## Deploy on HostEdge

Zero config — you do not set any ID or key anywhere.

1. **Push this repo to GitHub** (or fork it).
2. In HostEdge, **create a new project and connect the GitHub repo**.
3. **Add a SQL database** to the project. Name it `main`, binding name **`DB`**.
4. **Add a file storage** to the project. Binding name **`FILES`**.
5. **Deploy.**
6. Open your site. With no admin account yet you are redirected to the **setup wizard** (`/setup`).

The build command is `npm run deploy` (runs `opennextjs-cloudflare build`); `wrangler.jsonc` already declares the `DB` and `FILES` bindings, the `nodejs_compat` flag and a 15-minute Cron trigger (carrier tracking sync). Database migrations are applied automatically (idempotent `ensureSchema`) on the first request — you never run a migration by hand.

### First-run wizard

`/setup` asks for: store name, country, currency, default language, owner name/email/password, and whether to load **sample data** (products, categories, reviews, a `WELCOME10` coupon, quantity bundles). It also seeds the starter city list for your country and the static pages (About, Shipping policy, Returns, Contact, Terms). The wizard is only reachable while no user exists.

Then go to **Admin → Settings** to add your phone / WhatsApp / social links, and **Admin → Appearance** to set logo, colors, hero and sections.

### Optional environment variables

| Name | Purpose |
| --- | --- |
| `SECRETS_KEY` | Base secret used to encrypt carrier credentials stored in D1. If unset, a random per-install secret stored in the database is used. Set it for defence in depth (a DB leak alone can't then decrypt credentials). **Changing it later makes saved carrier credentials unreadable** — re-enter them. |

Nothing else is required. Never commit secrets (`.env*` is git-ignored).

---

## Local development

```bash
npm install
npm run dev          # Next.js dev server; D1/R2 are emulated locally by wrangler (state in .wrangler/)
npm run seed         # optional: sample data via script (the wizard can also do it)
npm test             # unit tests (pricing, totals, status transitions, phone validation, money, csv, crypto, carriers)
npm run lint && npm run typecheck
npm run preview      # build with OpenNext and run in the real Workers runtime (workerd)
```

Schema changes: edit `src/db/schema.ts`, run `npm run db:generate` (drizzle-kit → `/migrations`, then re-bundles them into `src/db/migrations.generated.ts` — Workers have no filesystem, so migrations are embedded at build time).

---

## What's inside

### Storefront (design v14 — "Stride", shoes & bags)
This branch is a storefront built for a footwear and bags store: concrete-grey paper, an always-black bar with an electric-lime accent, condensed italic Oswald headlines with a lime marker, cut-corner angular cards with colour dots taken from the variants, a ticker band, a tilted product-collage hero and a full-screen black menu with a lime slash. The buy box has **colour swatches and a size grid** (variants with `Color` and `Size` options; sold-out sizes are struck through per colour). The product page adds a **fit meter** (facts row `Fit: Runs small / True to size / Runs large`, EN/FR/AR), a **EU size → foot-length chart** generated automatically from numeric `Size` options (30–50), free size-exchange and try-then-pay reassurance. Bags use the same facts field for capacity, dimensions, material and compartments. Sample data is a generic footwear and bag catalogue (court sneaker, runner, chunky trainer, canvas, Chelsea boot, loafer, slides, backpack, crossbody, tote, duffel, wallet) with colour × size variants and flat illustrations. Colors, fonts, hero and sections remain editable in Admin → Appearance.
### Quantity offers ("buy 1 for 129, 2 for 229, 3 for 319")
Admin → Products → *Quantity offers*: add a fixed total price for 2, 3, … units of a product (optional badge, one "most popular"). The product page shows them as selectable cards with the per-unit price and the saving; picking a card sets the quantity, and the buy button, sticky bar, order form and the stored order all use the same total. Details:
- The pricing engine (`src/lib/pricing.ts`) picks the **cheapest combination** of packs for any quantity (with "2 for 229" and "3 for 319", 5 units cost 229 + 319), never charges more than the plain price, and takes the better of a fixed offer and a store-wide percentage bundle.
- For products with variants priced differently, the pack price scales with the variant's price.
- All units in a pack share the options chosen above the cards (one variant per order line).
- Fixed offers are stored in the existing `bundles` table (`price`, `label`, `popular`); they show up read-only under Coupons & bundles. Store-wide "buy 3, save 15%" percentage bundles still work and also appear as cards.
- Sample data seeds offers on the featured products.

### Storefront
Mobile-first and light on JS: server-rendered pages, scroll-snap swipe gallery, native `<dialog>` for sheets/drawers, GET-form filters, localized RTL-safe layout (logical CSS properties).
Home (hero slides, announcement bar, categories, featured/best sellers, reviews, trust badges, footer with contacts + socials), catalog (search, category, price, in-stock filters, sort, pagination, skeletons), product page (gallery with swipe + zoom, variants with per-variant price/stock, quantity, reviews, related, sticky mobile buy bar, sold-out state, JSON-LD), guest cart (localStorage) with slide-over drawer + full page, free-shipping progress bar and coupons, single-page guest checkout, order confirmation, order tracking (order number + phone), static pages, sitemap, robots, OpenGraph, WhatsApp floating button.

### COD mode (Admin → Settings → Checkout → "Cash on Delivery mode")
- **ON (default):** no cart anywhere (icon, drawer, page all hidden/redirected). Big **"Order now — pay on delivery"** buttons on cards and the product page (sticky on mobile) open a fast order form: name, phone (country code, validated, WhatsApp-friendly), searchable city, address, notes, variant + quantity picker, bundle chips (“buy 2 save 10%”), free-shipping bar, coupon, live total with shipping + COD fee. Placement is admin-selectable: **inline**, **popup** (bottom sheet on mobile, modal on desktop) or a **dedicated checkout page**.
- **OFF:** normal cart + checkout, with COD as the payment method. `src/features/payments/provider.ts` is the provider interface where Stripe / CMI / Payzone / Tap / Moyasar can be added later (not built).
- **Anti-fraud:** honeypot field, rate limit per IP and per phone, duplicate-order detection (same phone + product within N minutes returns the existing order), admin phone blocklist, optional “Pending confirmation” step with click-to-WhatsApp/call, abandoned-order capture (phone/name saved when a valid phone is typed).
- **Shipping rules:** fee per city/region, free above a threshold, per-carrier fee override, per-city “COD available” toggle.

### Orders & statuses
`New → Pending confirmation → Confirmed → No answer (attempt counter) → Postponed (date) → Cancelled → Ready to ship → Shipped / Picked up → Out for delivery → Delivered (cash collected) → Delivery failed → Returned → Return received → Refunded`. Labels, colors and translations are editable. Transitions are validated (`src/lib/order-status.ts`), every change is recorded with timestamp + user, plus internal notes.
**Stock:** reserved when an order is *confirmed*, released on cancel/return. Reservation is atomic: `CHECK (stock >= 0)` makes an oversell abort the whole D1 batch, so concurrent confirms can't drive stock negative. Order creation is idempotent (client key + unique index) and runs as one D1 batch.
Admin order list: status tabs, filters (status, city, carrier, date), search by phone/name/order number/tracking, bulk actions (confirm, change status, send to carrier, packing slips, CSV), CSV export, printable **invoice** and **packing slip**, **COD cash** view (expected / collected / in transit / pending remittance / carrier fees / net).

### Admin
Dashboard · Orders · COD cash · Abandoned · Products (variants, drag-to-reorder images uploaded to R2, bulk edit, CSV import/export) · Categories · Coupons & bundles · Reviews · Customers (+ blocklist) · Appearance (logo, favicon, colors with contrast check, button style, fonts incl. Cairo/Tajawal, hero slides, home sections order/visibility, announcement bar, trust badges, live preview) · Pages · Shipping · Settings (store, contacts, social, checkout, cities, analytics IDs with COD purchase events, statuses, WhatsApp templates) · Team (owner/staff, invites) · Activity log · Backup (JSON/CSV). Command search (`Ctrl/⌘ K`), dark mode, responsive sidebar.

### Security
PBKDF2-SHA256 (100k, the Workers maximum) via WebCrypto · session cookie `httpOnly`, `secure`, `sameSite=lax`, token stored only as SHA-256 · login rate limiting (per IP and per email) · Server Actions' built-in Origin check + same-origin check on the upload route · permission check inside **every** admin action (`run()` in `src/features/admin/run.ts`) · Zod validation at every boundary · uploads validated by magic bytes (not the client MIME), max 5 MB, JPEG/PNG/WebP/AVIF only, resized to WebP in the browser before upload · secure headers · carrier credentials AES-GCM-encrypted in D1 and never sent back to the client · CSV exports neutralise formula injection.

---

## Carrier setup guide

See **[docs/CARRIERS.md](docs/CARRIERS.md)** for the per-carrier status. **Read it before promising live carrier integration:** the build environment could not reach any carrier's API documentation, and endpoints were deliberately **not guessed**, so **all 15 carriers currently ship as export-only** (`CarrierAdapter` implemented, `hasApi: false`).

Using a carrier today (Admin → Shipping):
1. Enable the carrier (owner only).
2. Map your cities (optional) and set the **default carrier per city**.
3. From an order or the bulk bar choose the carrier → **CSV for <carrier>** → upload the file in the carrier's portal (rename/reorder headers if their template differs — the generic template is flagged *unverified*).
4. Paste the tracking number on the order (**Save**) — the order moves to *Shipped* and the customer sees the carrier tracking link.

Adding a real API integration later = replace `exportOnlyCarrier(...)` in `src/features/shipping/carriers/<id>/index.ts` with an adapter implementing `createShipment / getTracking / cancelShipment / getLabel / listCities / webhookHandler / testConnection`. The credentials form (encrypted, write-only), “Test connection”, city mapping import, bulk send with retry, label PDF → R2, webhook route (`/api/carriers/<id>/webhook`) and the 15-minute Cron poll (`/api/cron/sync-tracking`) are already wired and unit-tested with mocks.

---

## Defaults I chose (change in Admin)

- Default language French, store currency from the wizard country, COD mode ON, order starts as *Pending confirmation*, duplicate window 30 min, 8 orders/h per IP and 5/day per phone.
- Dashboard day buckets are UTC.
- Admin UI is English-only; the storefront is fully AR/FR/EN.
- Tax: a single store-wide rate (inclusive or exclusive).
- Fonts load from Google Fonts (preconnected, `display=swap`).
- Email/WhatsApp notifications: click-to-send WhatsApp links with editable templates; no provider is called automatically.

## Project layout

```
src/app/            routes ((shop) storefront, admin/(panel), admin/(print), api, setup)
src/features/<f>/   components · actions · queries · schema (catalog, checkout, orders, shipping, appearance, settings, crm, team, payments…)
src/lib/            pure, unit-tested logic (pricing, money, phone, order-status, crypto, csv)
src/db/             Drizzle schema, ensureSchema, bundled migrations
migrations/         SQL migrations (drizzle-kit)
worker.ts           Workers entry: OpenNext fetch + Cron `scheduled` handler
```
