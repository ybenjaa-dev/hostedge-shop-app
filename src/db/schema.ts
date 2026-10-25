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
    role: text("role", { enum: ["owner", "staff"] }).notNull().default("staff"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
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
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey(), // sha-256 of the token
  email: text("email").notNull(),
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("staff"),
  expiresAt: integer("expires_at").notNull(),
  createdAt: ts("created_at"),
});

export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});

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
    recovered: integer("recovered", { mode: "boolean" }).notNull().default(false),
    createdAt: ts("created_at"),
    updatedAt: ts("updated_at"),
  },
  (t) => [index("abandoned_updated_idx").on(t.recovered, t.updatedAt)],
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
