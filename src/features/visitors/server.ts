import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { newId } from "@/lib/id";
import { parseUA } from "@/lib/ua";
import { isLang } from "@/lib/i18n-core";
import { loadBlocks, invalidateBlocks } from "./block-index";
import { clientIpOf, extractSignals, ipuaHash, learnSignals, matchSignals, type Signal } from "./signals";

export type Geo = { ip: string | null; country: string | null; region: string | null; city: string | null; timezone: string | null; latitude: string | null; longitude: string | null; network: string | null };

/** Where a request comes from, as Cloudflare sees it (empty on a local machine). */
export function geoOf(req: Request): Geo {
  let cf: Record<string, unknown> = {};
  try { cf = ((getCloudflareContext() as unknown as { cf?: Record<string, unknown> }).cf ?? {}); } catch { /* not on Workers */ }
  const h = req.headers;
  const s = (v: unknown) => (typeof v === "string" && v ? v.slice(0, 80) : null);
  const country = s(cf.country) ?? s(h.get("cf-ipcountry"));
  return {
    ip: s(h.get("cf-connecting-ip")) ?? s((h.get("x-forwarded-for") ?? "").split(",")[0]?.trim()),
    country: country && !["XX", "T1"].includes(country) ? country.toUpperCase() : null,
    region: s(cf.region), city: s(cf.city) ? decodeURIComponentSafe(s(cf.city)!) : null, timezone: s(cf.timezone) ?? null,
    latitude: s(cf.latitude), longitude: s(cf.longitude), network: s(cf.asOrganization),
  };
}
const decodeURIComponentSafe = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };

export type VisitBody = { fp?: string; path?: string; referrer?: string; lang?: string; screen?: string; tz?: string; utm?: Record<string, string>; ua?: string };
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);

/** Create or refresh the visitor row and return its id. A new "visit" starts after 30 minutes of silence. */
export async function recordVisit(req: Request, body: VisitBody, vid: string | null): Promise<{ id: string; isNew: boolean } | null> {
  await ensureSchema();
  const db = getEnv().DB;
  const ua = req.headers.get("user-agent") ?? "";
  const parsed = parseUA(ua);
  if (parsed.device === "bot") return null;
  const g = geoOf(req);
  const fp = clip(body.fp, 64);
  const now = Date.now();
  const existing = vid && /^[a-z0-9]{16,32}$/.test(vid) ? await db.prepare("SELECT id, last_seen AS lastSeen FROM visitors WHERE id = ?").bind(vid).first<{ id: string; lastSeen: number }>() : null;
  const lang = isLang(body.lang) ? body.lang : null;
  const common = [fp, g.ip, g.country, g.region, g.city, g.timezone ?? clip(body.tz, 60), g.latitude, g.longitude, g.network, ua.slice(0, 300), parsed.browser, parsed.os, parsed.device, clip(body.screen, 20), lang];
  if (existing) {
    const newVisit = now - existing.lastSeen > 30 * 60_000;
    await db.prepare(`UPDATE visitors SET fp = COALESCE(?, fp), ip = COALESCE(?, ip), country = COALESCE(?, country), region = COALESCE(?, region), city = COALESCE(?, city), timezone = COALESCE(?, timezone), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude), network = COALESCE(?, network), ua = ?, browser = ?, os = ?, device = ?, screen = COALESCE(?, screen), lang = COALESCE(?, lang), last_seen = ?, page_views = page_views + 1, visits = visits + ? WHERE id = ?`)
      .bind(...common, now, newVisit ? 1 : 0, existing.id).run();
    return { id: existing.id, isNew: false };
  }
  const id = newId(24);
  let utm: string | null = null;
  if (body.utm && typeof body.utm === "object") { const o: Record<string, string> = {}; for (const [k, v] of Object.entries(body.utm).slice(0, 8)) if (/^utm_|^(fbclid|ttclid|gclid)$/.test(k) && typeof v === "string") o[k] = v.slice(0, 80); if (Object.keys(o).length) utm = JSON.stringify(o); }
  await db.prepare(`INSERT INTO visitors (id, fp, ip, country, region, city, timezone, latitude, longitude, network, ua, browser, os, device, screen, lang, first_seen, last_seen, visits, page_views, referrer, landing, utm, orders, push) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,1,?,?,?,0,0)`)
    .bind(id, ...common, now, now, clip(body.referrer, 300), clip(body.path, 300), utm).run();
  return { id, isNew: true };
}

/** Tie an order to the visitor (device) that placed it. */
export async function linkOrderToVisitor(vid: string | null, orderId: string, phone: string) {
  if (!vid || !/^[a-z0-9]{16,32}$/.test(vid)) return;
  const db = getEnv().DB;
  const v = await db.prepare("SELECT id FROM visitors WHERE id = ?").bind(vid).first<{ id: string }>();
  if (!v) return;
  await db.batch([
    db.prepare("UPDATE orders SET visitor_id = ? WHERE id = ?").bind(vid, orderId),
    db.prepare("UPDATE visitors SET phone = ?, orders = orders + 1 WHERE id = ?").bind(phone, vid),
  ]);
}

/** Which blocked signal (if any) matches this request: he_vid cookie, device fingerprint, phone, or IP + device class. Crawlers never match. */
export async function findBlock(h: Headers, extra: { fp?: string | null; phone?: string | null; vid?: string | null } = {}): Promise<Signal | null> {
  await ensureSchema();
  const { index, salt } = await loadBlocks(getEnv().DB, getEnv().SECRETS_KEY);
  if (!index.size) return null;
  const s = await extractSignals(h, salt);
  if (s.bot) return null;
  return matchSignals(index, { ...s, vid: extra.vid ?? s.vid, fp: extra.fp, phone: extra.phone });
}

/** Remember the new cookie / fingerprint / network of a visitor who just matched a strong signal, so the next request is stopped at the edge. */
export async function learnBlocked(h: Headers, match: Signal, fp: string | null | undefined, vid: string | null) {
  const { index, salt } = await loadBlocks(getEnv().DB, getEnv().SECRETS_KEY);
  const ipua = await ipuaHash(clientIpOf(h), h.get("user-agent") ?? "", salt);
  const add = learnSignals(index, match, { vid, fp, ipua });
  if (!add.length) return;
  const db = getEnv().DB, now = Date.now();
  await db.batch(add.map((a) => db.prepare("INSERT OR IGNORE INTO blocked_signals (id, kind, value, visitor_id, reason, created_at, hits) VALUES (?,?,?,?,?,?,0)").bind(newId(16), a.kind, a.value, match.visitorId, "learned", now)));
  invalidateBlocks();
}
