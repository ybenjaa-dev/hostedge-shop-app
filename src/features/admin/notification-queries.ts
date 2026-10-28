import { getEnv } from "@/lib/env";
import { can, type Role } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import { FEED_DAYS, LOW_STOCK_AT, humanize, mergeFeed, type FeedItem } from "./notification-feed";

/** Open abandoned checkouts. Single place to switch when `abandoned_orders` gets a `status` column. */
const ABANDONED_OPEN_SQL = "recovered = 0";

type OrderRow = { id: string; number: string; name: string; city: string; total: number; currency: string; status: string; at: number; items: number };
type AbRow = { id: string; name: string | null; phone: string | null; product_name: string | null; at: number };
type StockRow = { id: string; name: string; qty: number; at: number; variant: string | null };
type RevRow = { id: string; name: string; rating: number; body: string; product: string | null; at: number };
type ShipRow = { id: string; number: string; err: string; carrier: string | null; at: number };

/** One D1 batch containing only the sections the role may view. Indexed filters (created_at / status) everywhere. */
export async function loadFeed(role: Role, now = Date.now()): Promise<{ items: FeedItem[]; pending: number | null }> {
  const db = getEnv().DB;
  const since = now - FEED_DAYS * 86_400_000;
  const stmts: D1PreparedStatement[] = [];
  const slots: string[] = [];
  const add = (k: string, s: D1PreparedStatement) => { slots.push(k); stmts.push(s); };

  if (can(role, "orders.view")) {
    add("orders", db.prepare("SELECT o.id, o.number, o.name, o.city, o.total, o.currency, o.status, o.created_at AS at, COALESCE((SELECT SUM(qty) FROM order_items WHERE order_id = o.id), 0) AS items FROM orders o WHERE o.created_at > ? ORDER BY o.created_at DESC LIMIT 10").bind(since));
    add("pending", db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status IN ('new','pending_confirmation')"));
    add("ship", db.prepare("SELECT id, number, shipment_error AS err, carrier_id AS carrier, updated_at AS at FROM orders WHERE created_at > ? AND shipment_error IS NOT NULL AND shipment_error != '' ORDER BY updated_at DESC LIMIT 5").bind(since));
  }
  if (can(role, "abandoned.view")) {
    add("ab", db.prepare(`SELECT id, name, phone, product_name, updated_at AS at FROM abandoned_orders WHERE ${ABANDONED_OPEN_SQL} AND updated_at > ? ORDER BY updated_at DESC LIMIT 8`).bind(since));
  }
  if (can(role, "products.view")) {
    const base = `p.status = 'published' AND p.track_stock = 1`;
    add("stock", db.prepare(`SELECT p.id, p.name, p.stock AS qty, p.updated_at AS at, NULL AS variant FROM products p WHERE ${base} AND p.stock <= ? AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id) ORDER BY p.stock LIMIT 6`).bind(LOW_STOCK_AT));
    add("vstock", db.prepare(`SELECT p.id, p.name, v.stock AS qty, p.updated_at AS at, v.name AS variant FROM product_variants v JOIN products p ON p.id = v.product_id WHERE ${base} AND v.stock <= ? ORDER BY v.stock LIMIT 6`).bind(LOW_STOCK_AT));
  }
  if (can(role, "reviews.moderate")) {
    add("rev", db.prepare("SELECT r.id, r.name, r.rating, r.body, r.created_at AS at, (SELECT name FROM products WHERE id = r.product_id) AS product FROM reviews r WHERE r.status = 'pending' AND r.created_at > ? ORDER BY r.created_at DESC LIMIT 6").bind(since));
  }
  if (!stmts.length) return { items: [], pending: null };

  const res = await db.batch(stmts);
  const rows = <T,>(k: string) => (res[slots.indexOf(k)]?.results ?? []) as T[];
  const pending = slots.includes("pending") ? (rows<{ n: number }>("pending")[0]?.n ?? 0) : null;

  const orders = rows<OrderRow>("orders").map<FeedItem>((o) => ({
    key: `o:${o.id}`, kind: "order", at: o.at, href: `/admin/orders/${o.id}`,
    title: `New order #${o.number}`, badge: humanize(o.status),
    lines: [`${o.name} · ${o.city}`, `${formatMoney(o.total, o.currency)} · ${o.items} item${o.items === 1 ? "" : "s"}`],
  }));
  const ship = rows<ShipRow>("ship").map<FeedItem>((o) => ({
    key: `s:${o.id}`, kind: "shipment", at: o.at, href: `/admin/orders/${o.id}`,
    title: `Carrier problem · #${o.number}`, badge: o.carrier ?? undefined, lines: [o.err.slice(0, 120)],
  }));
  const ab = rows<AbRow>("ab").map<FeedItem>((a) => ({
    key: `a:${a.id}`, kind: "abandoned", at: a.at, href: "/admin/abandoned",
    title: "Abandoned checkout", lines: [[a.name, a.phone].filter(Boolean).join(" · ") || "Unknown visitor", ...(a.product_name ? [a.product_name] : [])],
  }));
  const stock = [...rows<StockRow>("stock"), ...rows<StockRow>("vstock")].map<FeedItem>((p) => ({
    key: `p:${p.id}:${p.variant ?? ""}`, kind: "stock", at: p.at, href: `/admin/products/${p.id}`,
    title: p.qty === 0 ? "Out of stock" : "Low stock",
    badge: p.qty === 0 ? "0 left" : `${p.qty} left`,
    lines: [tr(p.name, "en") + (p.variant ? ` · ${p.variant}` : "")],
  }));
  const rev = rows<RevRow>("rev").map<FeedItem>((r) => ({
    key: `r:${r.id}`, kind: "review", at: r.at, href: "/admin/reviews",
    title: `New review · ${"★".repeat(Math.max(0, Math.min(5, r.rating)))}`, badge: "Pending",
    lines: [`${r.name}${r.product ? ` on ${tr(r.product, "en")}` : ""}`, r.body.slice(0, 100)],
  }));
  return { items: mergeFeed([orders, ship, ab, stock, rev]), pending };
}
