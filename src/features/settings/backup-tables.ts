/** Tables included in the JSON export. Sensitive columns/rows are removed; sessions, invites and rate limits are never exported. */
export const BACKUP_TABLES: { name: string; omitColumns?: string[]; where?: string }[] = [
  { name: "settings", where: "key NOT LIKE '%secret%' AND key NOT LIKE '%token%' AND key NOT LIKE '%password%'" },
  { name: "users", omitColumns: ["password_hash"] },
  { name: "categories" }, { name: "products" }, { name: "product_variants" }, { name: "product_images" },
  { name: "reviews" }, { name: "coupons" }, { name: "bundles" }, { name: "blocked_phones" }, { name: "blocked_signals" },
  { name: "customers" }, { name: "cities" },
  { name: "carriers", omitColumns: ["credentials"] }, { name: "carrier_cities" },
  { name: "orders" }, { name: "order_items" }, { name: "order_history" }, { name: "order_notes" },
  { name: "abandoned_orders" }, { name: "pages" }, { name: "activity_log" },
];
export const CSV_TABLES = ["orders", "customers", "products"] as const;
