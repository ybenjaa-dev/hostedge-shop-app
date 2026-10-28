// Pure helpers shared by the Worker entry and the app (no Next/Cloudflare imports, relative paths only).
import { parseUA } from "../../lib/ua";

export type SignalKind = "vid" | "fp" | "ipua" | "phone";
export type Signal = { id: string | null; kind: SignalKind; value: string; visitorId: string | null };
export type BlockIndex = Map<string, Signal>;
export type RequestSignals = { vid: string | null; fp?: string | null; ipua: string | null; phone?: string | null };

export const GOOGLE = "https://www.google.com/";
export const VID_COOKIE = "he_vid";
export const VID_RE = /^[a-z0-9]{16,32}$/;
export const FP_RE = /^[a-f0-9]{16,64}$/;
const STRENGTH: SignalKind[] = ["vid", "fp", "phone", "ipua"];

export const keyOf = (kind: SignalKind, value: string) => `${kind}:${value}`;
export const buildIndex = (signals: Signal[]): BlockIndex => new Map(signals.map((s) => [keyOf(s.kind, s.value), s]));

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Coarse device class: browser family + OS family + device type, so a shared NAT does not block unrelated device types. */
export function deviceClass(ua: string): string {
  const p = parseUA(ua);
  return `${p.browser}|${p.os}|${p.device}`;
}

export const isBotUA = (ua: string) => parseUA(ua).device === "bot";

/** Stable hash of client IP + coarse device class. Null when the IP is unknown (never hashes the device class alone). */
export async function ipuaHash(ip: string | null | undefined, ua: string, salt: string): Promise<string | null> {
  const clean = (ip ?? "").trim();
  if (!clean || !ua) return null;
  return (await sha256Hex(`${salt}|${clean}|${deviceClass(ua)}`)).slice(0, 32);
}

export function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return part.slice(i + 1) || null;
  }
  return null;
}

export const clientIpOf = (h: Headers) => h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

/** Signals readable from the request alone (no body, no database). */
export async function extractSignals(h: Headers, salt: string): Promise<RequestSignals & { bot: boolean }> {
  const ua = h.get("user-agent") ?? "";
  const vid = readCookie(h.get("cookie"), VID_COOKIE);
  return { vid: vid && VID_RE.test(vid) ? vid : null, ipua: await ipuaHash(clientIpOf(h), ua, salt), bot: isBotUA(ua) };
}

/** First blocked signal that matches, strongest kind first. IP+device class is the weakest. */
export function matchSignals(index: BlockIndex, s: RequestSignals): Signal | null {
  const cand: Record<SignalKind, string | null | undefined> = { vid: s.vid, fp: s.fp, phone: s.phone, ipua: s.ipua };
  for (const kind of STRENGTH) {
    const v = cand[kind];
    const hit = v ? index.get(keyOf(kind, v)) : undefined;
    if (hit) return hit;
  }
  return null;
}

/** New signals to remember after a match. Only a strong match (cookie/fingerprint/phone) teaches: a shared IP never spreads the block. */
export function learnSignals(index: BlockIndex, match: Signal | null, current: RequestSignals): { kind: SignalKind; value: string }[] {
  if (!match || match.kind === "ipua" || !match.visitorId) return [];
  const out: { kind: SignalKind; value: string }[] = [];
  const add = (kind: SignalKind, v: string | null | undefined, ok: boolean) => { if (v && ok && !index.has(keyOf(kind, v))) out.push({ kind, value: v }); };
  add("vid", current.vid, !!current.vid && VID_RE.test(current.vid));
  add("fp", current.fp, !!current.fp && FP_RE.test(current.fp));
  add("ipua", current.ipua, true);
  return out;
}

export function vidCookie(id: string, secure: boolean): string {
  return `${VID_COOKIE}=${id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export const googleRedirect = (setCookie?: string) => {
  const h = new Headers({ Location: GOOGLE, "Cache-Control": "no-store" });
  if (setCookie) h.append("Set-Cookie", setCookie);
  return new Response(null, { status: 302, headers: h });
};
