import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings, getRaw, setRaw, saveSettings } from "@/lib/settings";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { newId } from "@/lib/id";
import { getInstallSecret } from "@/features/orders/service";
import { generateVapid, sendPush, type VapidKeys } from "./webpush";

const KEY = "vapid_private";

/** The site's VAPID key pair; created on first use. The private half is encrypted at rest. */
export async function getVapid(): Promise<VapidKeys & { subject: string }> {
  await ensureSchema();
  const s = await getSettings();
  const secret = await getInstallSecret();
  const raw = await getRaw(KEY);
  let keys: VapidKeys | null = null;
  if (raw) { try { keys = await decryptJson<VapidKeys>(raw, secret); } catch { keys = null; } }
  if (!keys) {
    keys = await generateVapid();
    await setRaw(KEY, await encryptJson(keys, secret));
    await saveSettings("engage", { ...s.engage, vapidPublic: keys.publicKey });
  } else if (s.engage.vapidPublic !== keys.publicKey) {
    await saveSettings("engage", { ...s.engage, vapidPublic: keys.publicKey });
  }
  return { ...keys, subject: s.engage.vapidSubject || (s.store.email ? `mailto:${s.store.email}` : "mailto:admin@example.com") };
}

export type Audience = { lang?: string; country?: string; city?: string; ordered?: "yes" | "no" };

function audienceSql(a: Audience): { where: string; args: unknown[] } {
  const w = ["s.active = 1"]; const args: unknown[] = [];
  if (a.lang) { w.push("s.lang = ?"); args.push(a.lang); }
  if (a.country) { w.push("s.country = ?"); args.push(a.country.toUpperCase()); }
  if (a.city) { w.push("s.city = ?"); args.push(a.city); }
  if (a.ordered === "yes") w.push("EXISTS (SELECT 1 FROM visitors v WHERE v.id = s.visitor_id AND v.orders > 0)");
  if (a.ordered === "no") w.push("NOT EXISTS (SELECT 1 FROM visitors v WHERE v.id = s.visitor_id AND v.orders > 0)");
  return { where: w.join(" AND "), args };
}
export async function countAudience(a: Audience): Promise<number> {
  const { where, args } = audienceSql(a);
  return (await getEnv().DB.prepare(`SELECT COUNT(*) AS n FROM push_subscriptions s WHERE ${where}`).bind(...args).first<{ n: number }>())?.n ?? 0;
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string; failures: number };
const PER_RUN = 45; // Workers allow ~50 outgoing requests per invocation on the free plan

/** Deliver a campaign to the next batch of subscribers that haven't had it yet. Returns whether more remain. */
export async function sendCampaignBatch(messageId: string, limit = PER_RUN): Promise<{ sent: number; failed: number; remaining: number }> {
  await ensureSchema();
  const db = getEnv().DB;
  const m = await db.prepare("SELECT id, title, body, url, image, audience, status FROM push_messages WHERE id = ?").bind(messageId).first<{ id: string; title: string; body: string; url: string | null; image: string | null; audience: string; status: string }>();
  if (!m) return { sent: 0, failed: 0, remaining: 0 };
  let aud: Audience = {}; try { aud = JSON.parse(m.audience) as Audience; } catch { /* all */ }
  const { where, args } = audienceSql(aud);
  const subs = (await db.prepare(`SELECT s.id, s.endpoint, s.p256dh, s.auth, s.failures FROM push_subscriptions s WHERE ${where} AND (s.last_msg IS NULL OR s.last_msg != ?) LIMIT ?`).bind(...args, messageId, limit).all<Sub>()).results;
  const keys = await getVapid();
  const s = await getSettings();
  const iconKey = s.branding.favicon || s.branding.logo;
  const icon = iconKey ? (iconKey.startsWith("/") ? iconKey : `/files/${iconKey}`) : undefined;
  let ok = 0, bad = 0;
  const now = Date.now();
  for (let i = 0; i < subs.length; i += 15) {
    const chunk = subs.slice(i, i + 15);
    const res = await Promise.all(chunk.map((sub) => sendPush(sub, { title: m.title, body: m.body, url: m.url ?? "/", image: m.image ? `/files/${m.image}` : undefined, icon, id: m.id, tag: `msg-${m.id}` }, keys, keys.subject)));
    const stmts: D1PreparedStatement[] = [];
    res.forEach((r, k) => {
      const sub = chunk[k]!;
      if (r.ok) { ok++; stmts.push(db.prepare("UPDATE push_subscriptions SET last_msg = ?, last_sent_at = ?, failures = 0 WHERE id = ?").bind(messageId, now, sub.id)); }
      else if (r.gone) { bad++; stmts.push(db.prepare("DELETE FROM push_subscriptions WHERE id = ?").bind(sub.id)); }
      else { bad++; stmts.push(db.prepare("UPDATE push_subscriptions SET last_msg = ?, failures = failures + 1, active = CASE WHEN failures >= 4 THEN 0 ELSE active END WHERE id = ?").bind(messageId, sub.id)); }
    });
    if (stmts.length) await db.batch(stmts);
  }
  const left = (await db.prepare(`SELECT COUNT(*) AS n FROM push_subscriptions s WHERE ${where} AND (s.last_msg IS NULL OR s.last_msg != ?)`).bind(...args, messageId).first<{ n: number }>())?.n ?? 0;
  await db.prepare("UPDATE push_messages SET delivered = delivered + ?, failed = failed + ?, status = ? WHERE id = ?").bind(ok, bad, left ? "sending" : "sent", messageId).run();
  return { sent: ok, failed: bad, remaining: left };
}

/** Compose + start sending. */
export async function createCampaign(input: { title: string; body: string; url?: string; image?: string; audience: Audience; createdBy: string }): Promise<{ id: string; targeted: number }> {
  await ensureSchema();
  const targeted = await countAudience(input.audience);
  const id = newId();
  await getEnv().DB.prepare("INSERT INTO push_messages (id, title, body, url, image, audience, status, targeted, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .bind(id, input.title, input.body, input.url || null, input.image || null, JSON.stringify(input.audience), targeted ? "sending" : "sent", targeted, input.createdBy, Date.now()).run();
  return { id, targeted };
}

/** Cron: keep delivering campaigns that were too big for one request. */
export async function continueCampaigns(): Promise<number> {
  await ensureSchema();
  const r = await getEnv().DB.prepare("SELECT id FROM push_messages WHERE status = 'sending' ORDER BY created_at LIMIT 3").all<{ id: string }>();
  let n = 0;
  for (const m of r.results) n += (await sendCampaignBatch(m.id)).sent;
  return n;
}
