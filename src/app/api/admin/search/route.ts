import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { rateLimit } from "@/lib/ratelimit";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/money";
import { statusInfo } from "@/lib/status-labels";
import { likeEsc, tokens } from "@/lib/search-fold";
import { ensureSearchIndex } from "@/features/catalog/search";
import { parseI18n, tr } from "@/lib/i18n-core";

export type Hit = { group: "orders" | "products" | "customers" | "visitors"; title: string; sub: string; href: string; image?: string | null; badge?: { label: string; color: string } | null; right?: string };

/** Admin command-palette search: orders, products, customers and visitors the signed-in role may see. */
export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u) return Response.json({ hits: [] }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return Response.json({ hits: [] });
  if (!(await rateLimit(`asearch:${u.id}`, 120, 60)).ok) return Response.json({ hits: [] }, { status: 429 });
  await ensureSchema();
  const db = getEnv().DB, s = await getSettings();
  const cur = s.store.currency;
  const like = `%${likeEsc(q)}%`;
  const digits = q.replace(/\D/g, "");
  const num = q.replace(/^#/, "");
  const hits: Hit[] = [];
  const jobs: Promise<void>[] = [];

  if (can(u.role, "orders.view")) jobs.push((async () => {
    const r = await db.prepare(`SELECT id, number, name, phone, status, total, created_at AS at FROM orders
      WHERE number = ? OR number LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR tracking_number LIKE ? ESCAPE '\\' ${digits.length >= 4 ? "OR phone LIKE ?" : ""}
      ORDER BY (number = ?) DESC, created_at DESC LIMIT 5`).bind(...[num, `${likeEsc(num)}%`, like, like, ...(digits.length >= 4 ? [`%${digits.replace(/^0+/, "")}%`] : []), num]).all<{ id: string; number: string; name: string; phone: string; status: string; total: number; at: number }>();
    for (const o of r.results) { const st = statusInfo(s, o.status, "en"); hits.push({ group: "orders", title: `#${o.number} · ${o.name}`, sub: `+${o.phone} · ${new Date(o.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`, href: `/admin/orders/${o.id}`, badge: st, right: formatMoney(o.total, cur, "en") }); }
  })());

  if (can(u.role, "products.view")) jobs.push((async () => {
    await ensureSearchIndex();
    const words = tokens(q);
    const where = words.length ? words.map(() => "p.search_text LIKE ? ESCAPE '\\'").join(" AND ") : "p.sku LIKE ? ESCAPE '\\'";
    const args = words.length ? words.map((w) => `%${likeEsc(w)}%`) : [like];
    const r = await db.prepare(`SELECT p.id, p.name, p.price, p.status, p.sku, (SELECT key FROM product_images i WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image FROM products p WHERE ${where} OR p.sku LIKE ? ESCAPE '\\' ORDER BY p.updated_at DESC LIMIT 5`).bind(...args, like).all<{ id: string; name: string; price: number; status: string; sku: string | null; image: string | null }>();
    for (const p of r.results) hits.push({ group: "products", title: tr(parseI18n(p.name), "en") || tr(parseI18n(p.name), s.store.defaultLang), sub: [p.sku, p.status !== "published" ? p.status : null].filter(Boolean).join(" · ") || "Product", href: `/admin/products/${p.id}`, image: p.image, right: formatMoney(p.price, cur, "en") });
  })());

  if (can(u.role, "customers.view")) jobs.push((async () => {
    const r = await db.prepare(`SELECT id, name, phone, orders_count AS n FROM customers WHERE name LIKE ? ESCAPE '\\' ${digits.length >= 4 ? "OR phone LIKE ?" : ""} ORDER BY last_order_at DESC LIMIT 4`).bind(...[like, ...(digits.length >= 4 ? [`%${digits.replace(/^0+/, "")}%`] : [])]).all<{ id: string; name: string; phone: string; n: number }>();
    for (const c of r.results) hits.push({ group: "customers", title: c.name, sub: `+${c.phone}`, href: `/admin/customers/${c.id}`, right: `${c.n} order${c.n === 1 ? "" : "s"}` });
  })());

  if (can(u.role, "visitors.view") && q.length >= 3) jobs.push((async () => {
    const r = await db.prepare("SELECT id, fp, ip, city, country, browser, os FROM visitors WHERE ip LIKE ? OR city LIKE ? ESCAPE '\\' OR fp LIKE ? OR id = ? ORDER BY last_seen DESC LIMIT 3").bind(`${q}%`, like, `${q}%`, q).all<{ id: string; fp: string | null; ip: string | null; city: string | null; country: string | null; browser: string | null; os: string | null }>();
    for (const v of r.results) hits.push({ group: "visitors", title: v.fp ? v.fp.slice(0, 10) : v.id.slice(0, 10), sub: [v.city, v.country, v.ip].filter(Boolean).join(" · "), href: `/admin/visitors/${v.id}`, right: [v.browser, v.os].filter(Boolean).join(" · ") });
  })());

  await Promise.all(jobs);
  return Response.json({ hits });
}
