import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const now = () => Date.now();
const ts = (name: string) => integer(name).notNull().$defaultFn(now);

/** Key/value store for all store configuration (JSON-encoded values). */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["owner", "staff", "confirmer", "packer", "accountant"] }).notNull().default("staff"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    // profile (each person edits their own)
    phone: text("phone"),
    jobTitle: text("job_title"),
    bio: text("bio"),
    avatar: text("avatar"), // R2 key under uploads/avatars/
    createdAt: ts("created_at"),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha-256 of the cookie token
    userId: text("user_id").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: ts("created_at"),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(), // sha-256 of the token
  email: text("email").notNull(),
  role: text("role", { enum: ["owner", "staff", "confirmer", "packer", "accountant"] }).notNull().default("staff"),
  expiresAt: integer("expires_at").notNull(),
  createdAt: ts("created_at"),
});

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    resetAt: integer("reset_at").notNull(),
  },
  (t) => [index("rate_limits_reset_idx").on(t.resetAt)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(), // JSON {en,fr,ar}
    image: text("image"),
    position: integer("position").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)],
);

export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(), // JSON i18n
    shortDesc: text("short_desc").notNull().default("{}"),
    longDesc: text("long_desc").notNull().default("{}"),
    specs: text("specs").notNull().default("{}"), // JSON i18n; one "Label: value" per line (supplement facts, specs…)
    /** Lower-cased, accent-folded text of name (all languages), SKU, descriptions and category — what instant search matches against. */
    searchText: text("search_text"),
    offerTemplate: text("offer_template"), // quantity-offer card layout for this product; null → store default
    categoryId: text("category_id"),
    sku: text("sku"),
    price: integer("price").notNull(), // minor units
    compareAt: integer("compare_at"),
    stock: integer("stock").notNull().default(0), // used when product has no variants
    trackStock: integer("track_stock", { mode: "boolean" }).notNull().default(true),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    bestseller: integer("bestseller", { mode: "boolean" }).notNull().default(false),
    soldCount: integer("sold_count").notNull().default(0),
    seoTitle: text("seo_title").notNull().default("{}"),
    seoDesc: text("seo_desc").notNull().default("{}"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    index("products_status_cat_idx").on(t.status, t.categoryId),
    index("products_status_created_idx").on(t.status, t.createdAt),
    index("products_sku_idx").on(t.sku),
    // Makes concurrent over-selling impossible: a decrement below zero aborts the whole D1 batch.
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
  ],
);

export const productVariants = sqliteTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    name: text("name").notNull(), // display e.g. "M / Red"
    options: text("options").notNull().default("{}"), // JSON {Size:"M",Color:"Red"}
    sku: text("sku"),
    price: integer("price"), // null → product price
    stock: integer("stock").notNull().default(0),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("variants_product_idx").on(t.productId), check("variants_stock_nonneg", sql`${t.stock} >= 0`)],
);

export const productImages = sqliteTable(
  "product_images",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    key: text("key").notNull(), // R2 key
    alt: text("alt"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("images_product_idx").on(t.productId, t.position)],
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id"),
    name: text("name").notNull(),
    city: text("city"),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    status: text("status", { enum: ["pending", "approved", "hidden"] }).notNull().default("pending"),
    createdAt: ts("created_at"),
  },
  (t) => [index("reviews_product_status_idx").on(t.productId, t.status), index("reviews_status_idx").on(t.status, t.createdAt)],
);

export const coupons = sqliteTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    type: text("type", { enum: ["percent", "fixed", "free_shipping"] }).notNull(),
    value: integer("value").notNull().default(0), // percent (0-100) or minor units
    minSubtotal: integer("min_subtotal").notNull().default(0),
    maxUses: integer("max_uses"),
    used: integer("used").notNull().default(0),
    startsAt: integer("starts_at"),
    endsAt: integer("ends_at"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("coupons_code_idx").on(t.code)],
);

export const bundles = sqliteTable("bundles", {
  id: text("id").primaryKey(),
  productId: text("product_id"), // null → applies to all products
  minQty: integer("min_qty").notNull(),
  percent: integer("percent").notNull(),
  /** Fixed-price offer: total price (minor units) for exactly `minQty` units of `productId` ("buy 2 for 229"). null → percentage bundle. */
  price: integer("price"),
  /** Optional badge text on the offer card, e.g. "Family pack". */
  label: text("label"),
  popular: integer("popular", { mode: "boolean" }).notNull().default(false),
  /** Optional picture for the offer card (R2 key), e.g. a photo of the 3-pack. */
  image: text("image"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const blockedPhones = sqliteTable("blocked_phones", {
  phone: text("phone").primaryKey(), // E.164 digits
  reason: text("reason"),
  createdAt: ts("created_at"),
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    ordersCount: integer("orders_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    returnedCount: integer("returned_count").notNull().default(0),
    totalSpent: integer("total_spent").notNull().default(0),
    createdAt: ts("created_at"),
    lastOrderAt: integer("last_order_at"),
  },
  (t) => [uniqueIndex("customers_phone_idx").on(t.phone)],
);

export const cities = sqliteTable(
  "cities",
  {
    id: text("id").primaryKey(),
    country: text("country").notNull(), // ISO-2
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    region: text("region"),
    fee: integer("fee"), // null → default shipping fee
    freeAbove: integer("free_above"), // null → store threshold
    codAvailable: integer("cod_available", { mode: "boolean" }).notNull().default(true),
    defaultCarrier: text("default_carrier"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("cities_country_idx").on(t.country, t.active)],
);

export const carriers = sqliteTable("carriers", {
  id: text("id").primaryKey(), // adapter code e.g. "sendit"
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  credentials: text("credentials"), // AES-GCM encrypted JSON, never returned to the client
  config: text("config").notNull().default("{}"),
  updatedAt: ts("updated_at"),
});

export const carrierCities = sqliteTable(
  "carrier_cities",
  {
    carrierId: text("carrier_id").notNull(),
    cityId: text("city_id").notNull(),
    carrierCityId: text("carrier_city_id").notNull(),
    fee: integer("fee"), // optional per-carrier shipping fee override
  },
  (t) => [primaryKey({ columns: [t.carrierId, t.cityId] })],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    number: text("number").notNull(),
    idemKey: text("idem_key"),
    status: text("status").notNull().default("new"),
    customerId: text("customer_id"),
    name: text("name").notNull(),
    phone: text("phone").notNull(), // E.164 digits only
    country: text("country").notNull(),
    cityId: text("city_id"),
    city: text("city").notNull(),
    address: text("address").notNull(),
    notes: text("notes"),
    currency: text("currency").notNull(),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    codFee: integer("cod_fee").notNull().default(0),
    tax: integer("tax").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    paymentMethod: text("payment_method").notNull().default("cod"),
    carrierId: text("carrier_id"),
    trackingNumber: text("tracking_number"),
    labelKey: text("label_key"),
    shipmentError: text("shipment_error"),
    carrierStatus: text("carrier_status"),
    attempts: integer("attempts").notNull().default(0),
    postponeUntil: integer("postpone_until"),
    stockReserved: integer("stock_reserved", { mode: "boolean" }).notNull().default(false),
    cashCollected: integer("cash_collected").notNull().default(0),
    carrierFee: integer("carrier_fee").notNull().default(0),
    remitted: integer("remitted", { mode: "boolean" }).notNull().default(false),
    ip: text("ip"),
    source: text("source"),
    /** Ad-click context captured at checkout (JSON: fbp, fbc, ttp, ttclid, ua, url) — used for server-side (Conversions API) events later. */
    tracking: text("tracking"),
    /** The visitor (device) that placed the order — see the `visitors` table. */
    visitorId: text("visitor_id"),
    lang: text("lang"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    uniqueIndex("orders_idem_idx").on(t.idemKey),
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_created_idx").on(t.createdAt),
    index("orders_phone_idx").on(t.phone, t.createdAt),
    index("orders_city_idx").on(t.cityId),
    index("orders_carrier_idx").on(t.carrierId, t.status),
    index("orders_tracking_idx").on(t.trackingNumber),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    productId: text("product_id"),
    variantId: text("variant_id"),
    name: text("name").notNull(),
    variantName: text("variant_name"),
    sku: text("sku"),
    price: integer("price").notNull(),
    qty: integer("qty").notNull(),
    image: text("image"),
    /** Added after checkout through the one-click add-on offer. */
    addon: integer("addon", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_product_idx").on(t.productId)],
);

export const orderHistory = sqliteTable(
  "order_history",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    userId: text("user_id"),
    userName: text("user_name"),
    note: text("note"),
    createdAt: ts("created_at"),
  },
  (t) => [index("order_history_order_idx").on(t.orderId, t.createdAt)],
);

export const orderNotes = sqliteTable(
  "order_notes",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    userName: text("user_name").notNull(),
    body: text("body").notNull(),
    createdAt: ts("created_at"),
  },
  (t) => [index("order_notes_order_idx").on(t.orderId)],
);

export const abandonedOrders = sqliteTable(
  "abandoned_orders",
  {
    id: text("id").primaryKey(), // client token
    phone: text("phone"),
    name: text("name"),
    city: text("city"),
    productId: text("product_id"),
    productName: text("product_name"),
    /** Legacy flag kept in sync (converted => true). Never used to hide rows. */
    recovered: integer("recovered", { mode: "boolean" }).notNull().default(false),
    /** new -> contacted -> converted | dismissed (dismissed is reversible). */
    status: text("status").notNull().default("new"),
    note: text("note"),
    contactedAt: integer("contacted_at"),
    contactedCount: integer("contacted_count").notNull().default(0),
    convertedOrderId: text("converted_order_id"),
    address: text("address"),
    /** JSON: [{productId, variantId, name, variantName, qty, unitPrice}] */
    lines: text("lines"),
    subtotal: integer("subtotal"),
    total: integer("total"),
    currency: text("currency"),
    coupon: text("coupon"),
    lang: text("lang"),
    /** Short human label: utm source / referrer host / click id kind. */
    source: text("source"),
    device: text("device"),
    /** JSON: page url, referrer, utm_*, phone country. */
    extra: text("extra"),
    saves: integer("saves").notNull().default(1),
    lastSeenAt: integer("last_seen_at"),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [
    index("abandoned_updated_idx").on(t.recovered, t.updatedAt),
    index("abandoned_status_idx").on(t.status, t.updatedAt),
    index("abandoned_phone_idx").on(t.phone),
  ],
);

export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(), // JSON i18n
    body: text("body").notNull().default("{}"), // JSON i18n (plain text / simple markdown)
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("pages_slug_idx").on(t.slug)],
);

export const activityLog = sqliteTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    userName: text("user_name"),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    meta: text("meta"),
    createdAt: ts("created_at"),
  },
  (t) => [index("activity_created_idx").on(t.createdAt)],
);

/** Media library: every uploaded image, with its compressed variants. `key` is the full-size WebP; `-md` / `-thumb` siblings exist when `variants` is true. */
export const media = sqliteTable(
  "media",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(), // original file name, editable
    alt: text("alt"),
    mime: text("mime").notNull(),
    width: integer("width"),
    height: integer("height"),
    size: integer("size").notNull().default(0), // bytes of the full-size file
    hash: text("hash"), // sha-256 of the stored full-size bytes (dedupe)
    sourceHash: text("source_hash"), // sha-256 of the original file the browser started from (dedupe)
    variants: integer("variants", { mode: "boolean" }).notNull().default(false),
    createdBy: text("created_by"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("media_key_idx").on(t.key), index("media_hash_idx").on(t.hash), index("media_source_hash_idx").on(t.sourceHash), index("media_created_idx").on(t.createdAt)],
);

/** Server-side ad events (Meta / TikTok Conversions API): one row per attempt target, with the platform's answer. */
export const trackingEvents = sqliteTable(
  "tracking_events",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id"),
    platform: text("platform", { enum: ["meta", "tiktok"] }).notNull(),
    event: text("event").notNull(),
    eventId: text("event_id").notNull(),
    status: text("status", { enum: ["ok", "error", "test"] }).notNull(),
    httpStatus: integer("http_status"),
    response: text("response"),
    attempts: integer("attempts").notNull().default(1),
    createdAt: ts("created_at"),
    updatedAt: integer("updated_at").notNull().$defaultFn(now),
  },
  (t) => [index("tracking_events_order_idx").on(t.orderId), index("tracking_events_created_idx").on(t.createdAt), uniqueIndex("tracking_events_uniq_idx").on(t.platform, t.eventId, t.event)],
);

/** "Frequently bought together" (kind=together, shown on the product page) and the one-click post-checkout offer (kind=addon). */
export const productLinks = sqliteTable(
  "product_links",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    linkedId: text("linked_id").notNull(),
    kind: text("kind", { enum: ["together", "addon"] }).notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("product_links_uniq_idx").on(t.productId, t.linkedId, t.kind), index("product_links_product_idx").on(t.productId, t.kind)],
);

/** Anonymous visitor registry (only for people who accepted the notice): where they come from and which device they use. `fp` is a hash of browser/device traits — no raw personal data. */
export const visitors = sqliteTable(
  "visitors",
  {
    id: text("id").primaryKey(), // random id kept in a first-party cookie
    fp: text("fp"),              // device fingerprint hash
    firstSeen: integer("first_seen").notNull().$defaultFn(now),
    lastSeen: integer("last_seen").notNull().$defaultFn(now),
    visits: integer("visits").notNull().default(1),
    pageViews: integer("page_views").notNull().default(1),
    ip: text("ip"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    timezone: text("timezone"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    network: text("network"),   // ISP / ASN organisation
    ua: text("ua"),
    browser: text("browser"),
    os: text("os"),
    device: text("device"),     // mobile | tablet | desktop
    screen: text("screen"),
    lang: text("lang"),
    referrer: text("referrer"),
    landing: text("landing"),
    utm: text("utm"),           // JSON
    phone: text("phone"),       // set once the visitor places an order
    orders: integer("orders").notNull().default(0),
    push: integer("push", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("visitors_fp_idx").on(t.fp), index("visitors_last_idx").on(t.lastSeen), index("visitors_country_idx").on(t.country), index("visitors_phone_idx").on(t.phone)],
);

/** Web Push subscriptions (one per browser). */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    visitorId: text("visitor_id"),
    lang: text("lang"),
    country: text("country"),
    city: text("city"),
    ua: text("ua"),
    createdAt: ts("created_at"),
    lastSentAt: integer("last_sent_at"),
    /** id of the last campaign delivered to this browser — lets a big send resume where it stopped. */
    lastMsg: text("last_msg"),
    failures: integer("failures").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("push_endpoint_idx").on(t.endpoint), index("push_visitor_idx").on(t.visitorId)],
);

/** Messages composed in the admin and the outcome of sending them. */
export const pushMessages = sqliteTable(
  "push_messages",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url"),
    image: text("image"),
    audience: text("audience").notNull().default("{}"), // JSON filter: lang / country / city
    status: text("status", { enum: ["sending", "sent"] }).notNull().default("sending"),
    targeted: integer("targeted").notNull().default(0),
    delivered: integer("delivered").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    createdBy: text("created_by"),
    createdAt: ts("created_at"),
  },
  (t) => [index("push_messages_created_idx").on(t.createdAt)],
);

/** Devices barred from ordering (matched by fingerprint). */
export const blockedFingerprints = sqliteTable("blocked_fingerprints", {
  fp: text("fp").primaryKey(),
  reason: text("reason"),
  createdAt: ts("created_at"),
});

/** Everything known about a blocked visitor: kind = vid | fp | ipua | phone. Enforced at the Worker edge and in the app. */
export const blockedSignals = sqliteTable(
  "blocked_signals",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    value: text("value").notNull(),
    visitorId: text("visitor_id"),
    reason: text("reason"),
    createdAt: ts("created_at"),
    lastHitAt: integer("last_hit_at"),
    hits: integer("hits").notNull().default(0),
  },
  (t) => [uniqueIndex("blocked_signals_kind_value_idx").on(t.kind, t.value), index("blocked_signals_visitor_idx").on(t.visitorId)],
);
