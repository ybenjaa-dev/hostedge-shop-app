import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { newId } from "@/lib/id";
import { ALLOWED_TYPES, MAX_UPLOAD, sniffImageType, variantKey } from "@/lib/storage";

export type MediaItem = { id: string; key: string; name: string; alt: string | null; mime: string; width: number | null; height: number | null; size: number; variants: boolean; createdAt: number };
type Row = { id: string; key: string; name: string; alt: string | null; mime: string; width: number | null; height: number | null; size: number; variants: number; created_at: number };
const COLS = "id, key, name, alt, mime, width, height, size, variants, created_at";
const toItem = (r: Row): MediaItem => ({ id: r.id, key: r.key, name: r.name, alt: r.alt, mime: r.mime, width: r.width, height: r.height, size: r.size, variants: !!r.variants, createdAt: r.created_at });

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
async function sha256(b: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", b as BufferSource);
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}
const HEX = /^[a-f0-9]{64}$/;

/** An already-stored copy of this picture (matches the browser's source hash or the stored bytes' hash). */
export async function findDuplicate(hash: string | null | undefined): Promise<MediaItem | null> {
  if (!hash || !HEX.test(hash)) return null;
  await ensureSchema();
  const r = await getEnv().DB.prepare(`SELECT ${COLS} FROM media WHERE hash = ?1 OR source_hash = ?1 ORDER BY created_at LIMIT 1`).bind(hash).first<Row>();
  return r ? toItem(r) : null;
}

export type SaveResult = { ok: true; media: MediaItem; duplicate: boolean } | { ok: false; error: string };

/** Store one upload: the full-size file plus optional `md` / `thumb` WebP variants made in the browser. Re-uploading the same picture returns the existing entry. */
export async function saveMedia(form: FormData, userId: string | null): Promise<SaveResult> {
  await ensureSchema();
  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, error: "No file" };
  if (file.size === 0) return { ok: false, error: "Empty file." };
  if (file.size > MAX_UPLOAD) return { ok: false, error: "File too large (max 5 MB)." };
  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(buf);
  if (!type) return { ok: false, error: "Unsupported image type. Use JPEG, PNG, WebP or AVIF." };

  const srcRaw = String(form.get("sourceHash") ?? "");
  const sourceHash = HEX.test(srcRaw) ? srcRaw : null;
  const hash = await sha256(buf);
  const dup = (await findDuplicate(hash)) ?? (await findDuplicate(sourceHash));
  if (dup) return { ok: true, media: dup, duplicate: true };

  const id = newId(20);
  const key = `uploads/${id}.${EXT[type]}`;
  const R2 = getEnv().FILES;
  const meta = { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" } };
  await R2.put(key, buf, meta);

  let variants = false;
  if (type === "image/webp") {
    variants = true;
    for (const [field, size] of [["md", "md"], ["thumb", "thumb"]] as const) {
      const v = form.get(field);
      if (!(v instanceof File) || v.size === 0 || v.size > MAX_UPLOAD) { variants = false; continue; }
      const vb = new Uint8Array(await v.arrayBuffer());
      if (sniffImageType(vb) !== "image/webp") { variants = false; continue; }
      await R2.put(variantKey(key, size), vb, meta);
    }
  }
  const num = (v: FormDataEntryValue | null) => { const n = parseInt(String(v ?? ""), 10); return Number.isFinite(n) && n > 0 && n < 20000 ? n : null; };
  const name = (String(form.get("name") ?? "").trim() || "image").slice(0, 160);
  const now = Date.now();
  await getEnv().DB.prepare("INSERT INTO media (id, key, name, mime, width, height, size, hash, source_hash, variants, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .bind(id, key, name, type, num(form.get("width")), num(form.get("height")), buf.length, hash, sourceHash, variants ? 1 : 0, userId, now).run();
  return { ok: true, duplicate: false, media: { id, key, name, alt: null, mime: type, width: num(form.get("width")), height: num(form.get("height")), size: buf.length, variants, createdAt: now } };
}

const UPLOAD_KEY = /uploads\/[A-Za-z0-9._-]{4,120}/g;
let lastSync = 0;
/** Register files that were uploaded before the library existed (or by seed data) so they show up too. */
export async function syncMedia(force = false) {
  if (!force && Date.now() - lastSync < 60_000) return;
  lastSync = Date.now();
  await ensureSchema();
  const db = getEnv().DB;
  const [a, b, c, d] = await db.batch([
    db.prepare("SELECT DISTINCT key AS k FROM product_images"),
    db.prepare("SELECT DISTINCT image AS k FROM categories WHERE image IS NOT NULL"),
    db.prepare("SELECT DISTINCT image AS k FROM bundles WHERE image IS NOT NULL"),
    db.prepare("SELECT value FROM settings"),
  ]);
  const keys = new Set<string>();
  for (const r of [...a!.results, ...b!.results, ...c!.results] as { k: string }[]) if (r.k?.startsWith("uploads/")) keys.add(r.k);
  for (const r of d!.results as { value: string }[]) for (const m of String(r.value).match(UPLOAD_KEY) ?? []) keys.add(m);
  if (!keys.size) return;
  const have = new Set(((await db.prepare("SELECT key FROM media").all<{ key: string }>()).results).map((r) => r.key));
  const missing = [...keys].filter((k) => !have.has(k));
  const now = Date.now();
  const stmts = missing.map((k, i) => {
    const ext = k.split(".").pop()?.toLowerCase() ?? "";
    const mime = ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : ext === "avif" ? "image/avif" : "image/jpeg";
    const name = k.replace(/^uploads\//, "").replace(/^sample-/, "sample ");
    return db.prepare("INSERT OR IGNORE INTO media (id, key, name, mime, size, variants, created_at) VALUES (?,?,?,?,0,0,?)").bind(newId(20), k, name, mime, now - i);
  });
  for (let i = 0; i < stmts.length; i += 50) await db.batch(stmts.slice(i, i + 50));
}

export async function listMedia(opts: { q?: string; before?: number; limit?: number; sync?: boolean } = {}): Promise<{ items: MediaItem[]; total: number; next: number | null }> {
  if (opts.sync !== false) await syncMedia();
  await ensureSchema();
  const db = getEnv().DB;
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 120);
  const like = opts.q?.trim() ? `%${opts.q.trim().replace(/[%_]/g, "")}%` : null;
  const conds: string[] = [], binds: unknown[] = [];
  if (like) { conds.push("(name LIKE ? OR alt LIKE ?)"); binds.push(like, like); }
  const totalConds = [...conds], totalBinds = [...binds];
  if (opts.before) { conds.push("created_at < ?"); binds.push(opts.before); }
  const wh = (c: string[]) => (c.length ? `WHERE ${c.join(" AND ")}` : "");
  const [rows, tot] = await db.batch([
    db.prepare(`SELECT ${COLS} FROM media ${wh(conds)} ORDER BY created_at DESC LIMIT ${limit + 1}`).bind(...binds),
    db.prepare(`SELECT COUNT(*) AS n FROM media ${wh(totalConds)}`).bind(...totalBinds),
  ]);
  const list = (rows!.results as Row[]);
  const more = list.length > limit;
  const items = list.slice(0, limit).map(toItem);
  return { items, total: (tot!.results[0] as { n: number }).n, next: more ? items[items.length - 1]!.createdAt : null };
}

export type Usage = { products: { id: string; name: string }[]; categories: number; offers: number; settings: boolean };
export async function mediaUsage(key: string): Promise<Usage> {
  const db = getEnv().DB;
  const like = `%${key}%`;
  const [p, c, o, s] = await db.batch([
    db.prepare("SELECT DISTINCT p.id, p.name FROM product_images i JOIN products p ON p.id = i.product_id WHERE i.key = ? LIMIT 20").bind(key),
    db.prepare("SELECT COUNT(*) AS n FROM categories WHERE image = ?").bind(key),
    db.prepare("SELECT COUNT(*) AS n FROM bundles WHERE image = ?").bind(key),
    db.prepare("SELECT COUNT(*) AS n FROM settings WHERE value LIKE ?").bind(like),
  ]);
  return {
    products: (p!.results as { id: string; name: string }[]).map((r) => { try { const n = JSON.parse(r.name) as Record<string, string>; return { id: r.id, name: n.en || n.fr || n.ar || r.id }; } catch { return { id: r.id, name: r.id }; } }),
    categories: (c!.results[0] as { n: number }).n, offers: (o!.results[0] as { n: number }).n, settings: (s!.results[0] as { n: number }).n > 0,
  };
}
export const isUsed = (u: Usage) => u.products.length + u.categories + u.offers > 0 || u.settings;

export async function deleteMedia(ids: string[], force: boolean): Promise<{ deleted: number; blocked: { id: string; name: string }[] }> {
  const db = getEnv().DB;
  let deleted = 0; const blocked: { id: string; name: string }[] = [];
  for (const id of ids.slice(0, 100)) {
    const r = await db.prepare(`SELECT ${COLS} FROM media WHERE id = ?`).bind(id).first<Row>();
    if (!r) continue;
    if (!force && isUsed(await mediaUsage(r.key))) { blocked.push({ id, name: r.name }); continue; }
    const R2 = getEnv().FILES;
    await R2.delete(r.key);
    if (r.variants) await R2.delete([variantKey(r.key, "md"), variantKey(r.key, "thumb")]);
    await db.prepare("DELETE FROM media WHERE id = ?").bind(id).run();
    deleted++;
  }
  return { deleted, blocked };
}
export const ACCEPT_TYPES = ALLOWED_TYPES;
