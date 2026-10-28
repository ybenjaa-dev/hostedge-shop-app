/**
 * Web Push from a Worker, with nothing but WebCrypto: VAPID (RFC 8292) request signing and aes128gcm payload encryption (RFC 8291).
 * Pure functions — the network call lives in server.ts.
 */
const enc = new TextEncoder();
export const b64u = (b: ArrayBuffer | Uint8Array) => { const u = b instanceof Uint8Array ? b : new Uint8Array(b); let s = ""; for (const x of u) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
export const unb64u = (s: string): Uint8Array => { const p = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4); const bin = atob(p); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const cat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource }, key, len * 8));
}

/** Encrypt `payload` for one subscription (RFC 8291). `asKeys` / `salt` are injectable only so the RFC's test vector can be checked. */
export async function encryptPayload(payload: Uint8Array, uaPublic: Uint8Array, authSecret: Uint8Array, opts: { asKeys?: CryptoKeyPair; salt?: Uint8Array; recordSize?: number } = {}): Promise<Uint8Array> {
  const as = opts.asKeys ?? (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const prk = await hkdf(authSecret, ecdh, cat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, prk, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, enc.encode("Content-Encoding: nonce\0"), 12);
  const rs = opts.recordSize ?? 4096;
  const body = cat(payload, new Uint8Array([2])); // last (only) record: delimiter 0x02
  const key = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce as BufferSource }, key, body as BufferSource));
  const header = cat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255]), new Uint8Array([asPublic.length]), asPublic);
  return cat(header, ct);
}

export type VapidKeys = { publicKey: string; privateJwk: JsonWebKey };
export async function generateVapid(): Promise<VapidKeys> {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  return { publicKey: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)), privateJwk: await crypto.subtle.exportKey("jwk", kp.privateKey) };
}

/** `Authorization` header value for a push endpoint (RFC 8292, "vapid t=…, k=…"). */
export async function vapidAuthorization(endpoint: string, keys: VapidKeys, subject: string, ttlSec = 12 * 3600, nowSec = Math.floor(Date.now() / 1000)): Promise<string> {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(enc.encode(JSON.stringify({ aud, exp: nowSec + ttlSec, sub: subject })));
  const key = await crypto.subtle.importKey("jwk", keys.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${claims}`)));
  return `vapid t=${head}.${claims}.${b64u(sig)}, k=${keys.publicKey}`;
}

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type PushResult = { ok: boolean; status: number; gone: boolean };

/** Send one notification. `gone` = the subscription is dead (404/410) and should be deleted. */
export async function sendPush(sub: PushTarget, message: { title: string; body: string; url?: string; icon?: string; image?: string; tag?: string; id?: string }, keys: VapidKeys, subject: string, fetcher: typeof fetch = fetch): Promise<PushResult> {
  const payload = enc.encode(JSON.stringify(message));
  let body: Uint8Array;
  try { body = await encryptPayload(payload, unb64u(sub.p256dh), unb64u(sub.auth)); } catch { return { ok: false, status: 0, gone: true }; } // a malformed key can never work: drop the subscription
  try {
    const r = await fetcher(sub.endpoint, { method: "POST", headers: { Authorization: await vapidAuthorization(sub.endpoint, keys, subject), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "normal" }, body: body as BodyInit });
    return { ok: r.status >= 200 && r.status < 300, status: r.status, gone: r.status === 404 || r.status === 410 };
  } catch {
    return { ok: false, status: 0, gone: false };
  }
}
