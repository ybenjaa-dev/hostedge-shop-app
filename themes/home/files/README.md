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

### Storefront (design v10 — "Hearth", home & kitchen)
This branch is a storefront built for a homeware store: warm oat paper with terracotta and sage, soft Fraunces headlines, chunky rounded cards, a one-row header with room pills (bottom-sheet room tiles on mobile), a **bento "shop by room" grid** (category images with a room icon), a bundle band, and on the product page a **dimensions / material / weight strip** and a **materials & care card** — all read from the product's facts field (`Dimensions: 40 × 28 cm`, `Material: Bamboo`, `Weight: 900 g`, `Care: …`, in EN/FR/AR labels; other rows such as capacity or max load are listed under care). Sizes and colours are ordinary variants. Sample data is a generic homeware catalogue (dinner set, board, skillet, jars, cushion, throw, vase, bedding, pillow, towels, baskets, shelf) with flat illustrations. Colors, fonts, hero and sections remain editable in Admin → Appearance.
### Quantity offers ("buy 1 for 129, 2 for 229, 3 for 319")
Admin → Products → *Quantity offers*: add a fixed total price for 2, 3, … units of a product (optional badge, one "most popular"). The product page shows them as selectable cards with the per-unit price and the saving; picking a card sets the quantity, and the buy button, sticky bar, order form and the stored order all use the same total. Details:
- The pricing engine (`src/lib/pricing.ts`) picks the **cheapest combination** of packs for any quantity (with "2 for 229" and "3 for 319", 5 units cost 229 + 319), never charges more than the plain price, and takes the better of a fixed offer and a store-wide percentage bundle.
- For products with variants priced differently, the pack price scales with the variant's price.
- All units in a pack share the options chosen above the cards (one variant per order line).
- Fixed offers are stored in the existing `bundles` table (`price`, `label`, `popular`); they show up read-only under Coupons & bundles. Store-wide "buy 3, save 15%" percentage bundles still work and also appear as cards.
- Each offer can have its own **photo** (e.g. a picture of the 3-pack): upload it on the offer row in the product form, or on a store-wide percentage bundle under Coupons & bundles. It shows as a thumbnail on the offer card.
- Sample data seeds offers on the featured products.

#### Offer card templates
Offers can be shown in five layouts: **List** (default), **Tiles**, **Photo cards**, **Compact pills** and **Highlight** (the most popular / best-value offer shown big). Pick one for the whole store or override it per product:
- **Store-wide:** Admin → Coupons & bundles → *Offer card layout* (saved in `settings.offers.template`).
- **Per product:** Admin → Products → *Quantity offers* → *Offer card layout*; "Store default" follows the store-wide choice (stored in `products.offer_template`, migration `0004`).
- Resolution order is product → store → `list` (`src/lib/offer-templates.ts`). The template travels with the bundle rules from `listBundles(productId)`, so themed product pages need no changes.
- Each storefront theme skins the cards through its scope class (`.v2`…`.v16`) in `globals.css`. Tiles, photo cards and pills drop the theme's clip-paths and the highlight card is declared outside the CSS layer, so theme skins can't hide them.
- Photo cards use the offer's own photo, or the product image stacked ×N when none is set.
- Sample data gives the featured products different templates so you can compare them.

Screenshots of every template on every storefront theme (390 px) are in [`docs/screenshots/offer-templates/`](docs/screenshots/offer-templates). Names and logos of every storefront: [`docs/brand/`](docs/brand). The sample data per storefront is in [`docs/sample-data/`](docs/sample-data).

### Media library (Admin → Media)
Every upload goes through one library, WordPress-style: a searchable grid with a details panel (rename, alt text, where it's used, copy link, delete — pictures still in use are protected). Anywhere you pick a picture (product images, categories, offer photos, logo, hero) a modal opens the same library, with drag-and-drop upload built in.
- **Compressed in the browser:** each upload becomes a full-size WebP (max 1600 px), a medium one (800 px) and a thumbnail (320 px). Storefront cards use the medium size, carts/admin lists the thumbnail (`fileUrl(key, "thumb" | "md" | "full")`; older uploads fall back to the full file).
- **No duplicates:** the file's SHA-256 is checked before upload (and again on the server); re-uploading the same picture reuses the existing entry. Table: `media` (migration `0005`). Files uploaded before the library existed (and seeded placeholders) are registered automatically.
- *Match photos to products* tab keeps the bulk "name the file after the product" importer.

### Server-side ad tracking (Meta & TikTok Conversions API)
Settings → *Analytics & ads*. Paste the pixel IDs and the **access tokens** (stored encrypted, never shown again) and every order is also sent from the server — hashed phone/name/city, IP, user agent and the ad-click ids (`_fbp`, `_fbc`, `ttclid`…) captured at checkout — with the same `event_id` as the browser pixel, so platforms de-duplicate instead of double counting.
- **Count a sale when…** *placed* (default), *confirmed* or *delivered*. For the last two the browser fires a **Lead** at checkout and the server sends the **Purchase** later, when the order really is confirmed/delivered (also from carrier tracking updates).
- Optional custom events `OrderConfirmed / OrderDelivered / OrderReturned` for audiences and delivery-rate reporting.
- Every send is logged (*Server events* panel) with the platform's answer; failures are retried by the 15-minute cron or the *Retry* button; a *Test* button uses your test event code. Code: `src/features/tracking/`.

### Upsells & cross-sells
- **Frequently bought together** (up to 3 per product): companions under the price with tick boxes; ticked ones join the same COD order.
- **One-tap add-on after checkout** (up to 2): the screen right after the order is placed offers a companion at a special price; one tap appends it to the same order (totals recomputed, free delivery unlocked if the new total passes the threshold, history note added). Closes when the order is confirmed or the window (default 30 min) ends.
- Set per product under *Cross-sell*; discount, window and on/off in Settings → Offers. Table `product_links`, `order_items.addon`.

### Team roles & performance
Roles: **Owner**, **Manager**, **Confirmer** (phone confirmation: confirm / no answer / postpone / cancel), **Packer** (ready to ship → delivered/returned, carriers, tracking), **Accountant** (read-only orders, COD cash, dashboard, performance). The menu, every page, every server action and every export/API checks the same permission table (`src/lib/permissions.ts`); a role can only move orders to the statuses it owns. *Team performance* (owner, manager, accountant) shows per teammate: orders handled, confirmed / cancelled / no answer / postponed, **confirmation rate**, first-response time, **delivered rate of the orders they confirmed** and cash delivered — built from the order history.

### Search, filters, language URLs, app & push

- **Instant search** — typing in any storefront search box shows matching products (picture + price) and categories, with keyboard navigation and recent searches. Matching ignores accents, Arabic diacritics and alef/ya variants, and every word must match (`src/lib/search-fold.ts`, a `products.search_text` column kept up to date on save/import).
- **Filters** — the shop page gets a price slider and variant-option chips (Size, Color… with counts) that apply instantly; they live in the URL (`?min=&max=&opt=Size:M|Color:Black`) so results can be shared. Without JavaScript the plain form still works.
- **Language URLs** (Settings → App, push & SEO → on by default) — every page is also served at `/ar/…`, `/fr/…`, `/en/…`. `worker.ts` strips the prefix, selects the language and rewrites internal links; each page gets a canonical URL and `hreflang` links (+ `x-default`), and `/sitemap.xml` becomes an index of `/sitemap/ar.xml`, `/sitemap/fr.xml`, `/sitemap/en.xml`, each URL listing its translations. Visiting an unprefixed URL still works (cookie-based) and canonicalises to the prefixed one.
- **Installable app (PWA)** — dynamic `/manifest.webmanifest` from your branding, a service worker (`/sw.js`: cached static assets, network-first pages, offline page), an install prompt after the second page view (iOS gets “Add to Home Screen” instructions).
- **Push notifications** — visitors are asked after a delay (never on cart/checkout); **Admin → Push notifications** sends a message to everyone or to a filtered audience (language, country, city, ordered / never ordered) with a live count and preview, and shows delivered/failed/opened. Web Push is implemented with WebCrypto only (RFC 8291/8292); the VAPID key pair is created on first use and the private half is stored encrypted. On the free Workers plan one request can send ~45 messages; the cron trigger keeps delivering large campaigns, or press **Continue** on the history row.
- **Visitor registry** (Admin → Visitors) — after the visitor accepts the privacy notice we store country, city, IP, device, browser, referrer/campaign and a device fingerprint (hash of browser traits). Orders are linked to the visitor; **Block this device** stops that fingerprint from ordering even with a new phone number. Nothing is recorded before consent. This is personal data (Morocco law 09-08, GDPR): keep your privacy page accurate.

### Languages & header switchers (Admin → Languages)

- **Add any language** — pick one of 25 presets (Español, Deutsch, Türkçe, Русский, 中文, اردو, فارسی…) or enter your own two-letter code, name, direction (LTR/RTL) and flag. It instantly gets its own tab on every translated field (products, categories, pages, hero…), its own `/xx` URLs, hreflang tags and sitemap, and a flag in the switcher.
- **Translate the interface** — **Translate** opens a table of every shop text (source on the left, your translation on the right, search / "not translated yet" filter) or work in a spreadsheet (download CSV → translator → import). Untranslated texts show in the language you chose to start from. **Edit wording** does the same for Arabic, French and English.
- **Switchers** — show or hide the language switcher and the light/dark button, separately on desktop and phones; flag + code / flag only / code / language name; default appearance (device / always light / always dark); optional detection of the visitor's browser language on the first visit. Settings are stored in the database, so no rebuild is needed.

### Responsive images
`/files/<key>?w=640` serves the best stored size (thumbnail 320 / medium 800 / full 1600). When the optional Cloudflare **Images binding** (`IMAGES` in `wrangler.jsonc`) is present, the file is resized to the requested width and converted to **AVIF/WebP** on the fly (cached at the edge, one transform per size). Product cards and galleries use `srcset`/`sizes` (`imgProps()` in `src/lib/image-sizes.ts`). No binding? Nothing breaks — remove the line from `wrangler.jsonc` and the stored sizes are served.

### Order form on the product page
Settings → Checkout → *Form placement*: **Inline — opens when the customer taps "Order now"**, **Inline — always visible** (the form sits on the page; the big button is replaced by it, and asks for a variant first if needed), **Popup** (bottom sheet) or **Separate checkout page**. On phones the sticky "Order now" bar slides away whenever the form is on screen (or the sheet is open) and comes back when it scrolls out of view.

### Admin UI kit
One look everywhere: `DataTable` (card that scrolls sideways *inside* itself), `Tabs`, `FilterBar` (filters and the Filter button always stay inside their card), and custom `DateField` / `DateRangeField` pickers (presets, keyboard support, bottom-sheet on phones) instead of the browser's native date input.

- **Rows with side sheets:** categories and coupons are tables like products; *New / Edit* opens a drawer that closes after saving. Coupons show a live "what customers see" ticket while you type.
- **Language tabs everywhere:** translated fields (name, descriptions, page body, appearance texts…) use one tab bar — FR / AR / EN with flags and a dot for "has content". Long descriptions and page bodies use a built-in rich-text editor (headings, lists, quotes, links); HTML is sanitised on save *and* on render (`src/lib/rich-text.ts`), older plain-text content still renders as paragraphs.
- **Offers:** fixed-price quantity offers are set on each product (with a live preview of the real offer cards in the shop's theme). The store-wide default layout and optional "buy N, save %" rule live in Settings → Offers.
- **Appearance studio:** big live preview next to the editor — click any part of the preview to jump to its settings, type straight onto texts, reorder/hide homepage sections from the preview, switch phone/tablet/desktop and language.
- **New-order alerts:** the admin polls for orders; a soft double "pip" (synthesised, no audio file), a toast, a bell toggle, a pending count on *Orders* and an optional desktop notification.
- **Order timeline:** progress tracker (New → Confirmed → Shipped → Delivered) plus an event feed with who changed what, how long each step took, and notes.
- **Language switcher:** soft-rounded colourful flags (Arabic → Morocco, French → France, English → United Kingdom); closes on outside click / Esc.
- **Anti-spam honeypot:** neutral field name with no label, so browsers/password managers can't auto-fill it and turn a real order into a fake one.

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
