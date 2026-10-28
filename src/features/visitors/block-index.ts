// In-isolate cache of blocked signals. State lives on globalThis because the Worker entry and the Next bundle are separate
// module graphs inside one isolate: both must see the same cache, and a block/unblock must invalidate it for both.
import { buildIndex, sha256Hex, type BlockIndex, type Signal, type SignalKind } from "./signals";

const TTL_MS = 30_000;
const HIT_EVERY_MS = 60_000;
type Loaded = { at: number; index: BlockIndex; salt: string };
type G = { __heBlock?: Loaded; __heBlockP?: Promise<Loaded>; __heHits?: Map<string, number>; __heStaff?: Map<string, { ok: boolean; at: number }> };
const g = globalThis as unknown as G;

async function load(db: D1Database, secretsKey: string | undefined): Promise<Loaded> {
  const [sig, legacyFp, legacyVid, secret] = await db.batch([
    db.prepare("SELECT id, kind, value, visitor_id AS visitorId FROM blocked_signals"),
    db.prepare("SELECT b.fp AS value, (SELECT v.id FROM visitors v WHERE v.fp = b.fp ORDER BY v.last_seen DESC LIMIT 1) AS visitorId FROM blocked_fingerprints b"),
    db.prepare("SELECT v.id AS value FROM visitors v WHERE v.fp IN (SELECT fp FROM blocked_fingerprints) OR (v.phone IS NOT NULL AND v.phone IN (SELECT phone FROM blocked_phones))"),
    db.prepare("SELECT value FROM settings WHERE key = 'install_secret'"),
  ]);
  const list: Signal[] = (sig!.results as { id: string; kind: SignalKind; value: string; visitorId: string | null }[]).map((r) => ({ id: r.id, kind: r.kind, value: r.value, visitorId: r.visitorId }));
  for (const r of legacyFp!.results as { value: string; visitorId: string | null }[]) list.push({ id: null, kind: "fp", value: r.value, visitorId: r.visitorId });
  for (const r of legacyVid!.results as { value: string }[]) list.push({ id: null, kind: "vid", value: r.value, visitorId: r.value });
  const index = buildIndex([...list].reverse()); // table rows (first in `list`) win over legacy-derived ones
  return { at: Date.now(), index, salt: secretsKey || ((secret!.results[0] as { value: string } | undefined)?.value ?? "") };
}

/** Blocked signals + hashing salt, reloaded at most every 30 s per isolate. Never throws: on failure the last good copy (or nothing) is used. */
export async function loadBlocks(db: D1Database, secretsKey?: string): Promise<{ index: BlockIndex; salt: string }> {
  const cur = g.__heBlock;
  if (cur && Date.now() - cur.at < TTL_MS) return cur;
  g.__heBlockP ??= load(db, secretsKey)
    .catch((): Loaded => ({ at: Date.now() - TTL_MS + 5_000, index: cur?.index ?? new Map(), salt: cur?.salt ?? "" })) // table not migrated yet: retry in 5 s
    .then((l) => { g.__heBlock = l; return l; })
    .finally(() => { g.__heBlockP = undefined; });
  return g.__heBlockP;
}

export function invalidateBlocks() { g.__heBlock = undefined; g.__heBlockP = undefined; }

/** Count a blocked attempt: at most one write per signal per minute. */
export function recordHit(db: D1Database, s: Signal): Promise<unknown> {
  if (!s.id) return Promise.resolve();
  const hits = (g.__heHits ??= new Map());
  const last = hits.get(s.id) ?? 0;
  if (Date.now() - last < HIT_EVERY_MS) return Promise.resolve();
  hits.set(s.id, Date.now());
  return db.prepare("UPDATE blocked_signals SET hits = hits + 1, last_hit_at = ? WHERE id = ?").bind(Date.now(), s.id).run().catch(() => {});
}

/** True when the cookie is a live staff session (checked only after a block matched, cached 60 s). */
export async function isStaffSession(db: D1Database, token: string | null): Promise<boolean> {
  if (!token) return false;
  const cache = (g.__heStaff ??= new Map());
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < 60_000) return hit.ok;
  let ok = false;
  try {
    const id = await sha256Hex(token);
    ok = !!(await db.prepare("SELECT 1 AS x FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ? AND u.active = 1").bind(id, Date.now()).first());
  } catch { ok = false; }
  if (cache.size > 200) cache.clear();
  cache.set(token, { ok, at: Date.now() });
  return ok;
}
