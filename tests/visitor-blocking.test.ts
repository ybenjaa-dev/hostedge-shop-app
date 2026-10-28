import { describe, expect, it } from "vitest";
import { buildIndex, extractSignals, googleRedirect, ipuaHash, learnSignals, matchSignals, deviceClass, type Signal } from "../src/features/visitors/signals";
import { EDGE_SKIP, edgeBlock } from "../src/features/visitors/edge-block";
import { invalidateBlocks } from "../src/features/visitors/block-index";

const CHROME_ANDROID = "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const CHROME_ANDROID_NEWVER = CHROME_ANDROID.replace("120", "121").replace("SM-A135F", "Pixel 7");
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const VID = "a".repeat(24), NEWVID = "b".repeat(24), FP = "f".repeat(32);

describe("ipua hash", () => {
  it("is stable, salted, and ignores browser minor versions / device model", async () => {
    const a = await ipuaHash("1.2.3.4", CHROME_ANDROID, "s");
    expect(a).toHaveLength(32);
    expect(a).toBe(await ipuaHash("1.2.3.4", CHROME_ANDROID_NEWVER, "s"));
    expect(a).not.toBe(await ipuaHash("1.2.3.4", CHROME_ANDROID, "other-salt"));
    expect(a).not.toBe(await ipuaHash("1.2.3.5", CHROME_ANDROID, "s"));
    expect(a).not.toBe(await ipuaHash("1.2.3.4", SAFARI_IOS, "s"));
    expect(deviceClass(CHROME_ANDROID)).toBe("Chrome|Android|mobile");
  });
  it("never hashes without an IP", async () => {
    expect(await ipuaHash(null, CHROME_ANDROID, "s")).toBeNull();
  });
});

describe("matching", () => {
  const sigs: Signal[] = [
    { id: "1", kind: "vid", value: VID, visitorId: VID },
    { id: "2", kind: "fp", value: FP, visitorId: VID },
    { id: "3", kind: "ipua", value: "ipuahash", visitorId: VID },
  ];
  const idx = buildIndex(sigs);
  it("matches cookie, fingerprint and ipua; strongest first", () => {
    expect(matchSignals(idx, { vid: VID, ipua: null })?.kind).toBe("vid");
    expect(matchSignals(idx, { vid: null, fp: FP, ipua: "x" })?.kind).toBe("fp");
    expect(matchSignals(idx, { vid: NEWVID, ipua: "ipuahash" })?.kind).toBe("ipua");
  });
  it("does not match a plain IP, or unknown signals", async () => {
    expect(matchSignals(idx, { vid: null, ipua: null })).toBeNull();
    expect(matchSignals(idx, { vid: NEWVID, fp: "0".repeat(32), ipua: await ipuaHash("1.2.3.4", SAFARI_IOS, "s") })).toBeNull();
  });
  it("extracts cookie + ipua from a request, flags bots", async () => {
    const h = new Headers({ cookie: `x=1; he_vid=${VID}`, "user-agent": CHROME_ANDROID, "cf-connecting-ip": "1.2.3.4" });
    const s = await extractSignals(h, "s");
    expect(s).toMatchObject({ vid: VID, bot: false, ipua: await ipuaHash("1.2.3.4", CHROME_ANDROID, "s") });
    expect((await extractSignals(new Headers({ "user-agent": BOT }), "s")).bot).toBe(true);
  });
});

describe("learning", () => {
  const idx = buildIndex([{ id: "1", kind: "fp", value: FP, visitorId: VID }]);
  it("a fingerprint match from a new cookie + network learns both", () => {
    const m = matchSignals(idx, { vid: NEWVID, fp: FP, ipua: "newipua" });
    expect(learnSignals(idx, m, { vid: NEWVID, fp: FP, ipua: "newipua" })).toEqual([{ kind: "vid", value: NEWVID }, { kind: "ipua", value: "newipua" }]);
  });
  it("an ipua-only match never spreads the block", () => {
    const i2 = buildIndex([{ id: "3", kind: "ipua", value: "ipuahash", visitorId: VID }]);
    const m = matchSignals(i2, { vid: NEWVID, fp: FP, ipua: "ipuahash" });
    expect(learnSignals(i2, m, { vid: NEWVID, fp: FP, ipua: "ipuahash" })).toEqual([]);
  });
  it("nothing to learn when there is no match or signals are known", () => {
    expect(learnSignals(idx, null, { vid: NEWVID, ipua: "x" })).toEqual([]);
    expect(learnSignals(idx, idx.get("fp:" + FP)!, { vid: null, fp: FP, ipua: null })).toEqual([]);
  });
});

describe("edge enforcement", () => {
  const db = (rows: unknown[], sessions = false) => ({
    prepare: (q: string) => ({
      bind: () => ({ first: async () => (sessions ? { x: 1 } : null), run: async () => ({}) }),
      first: async () => null,
      run: async () => ({}),
      q,
    }),
    batch: async () => [{ results: rows }, { results: [] }, { results: [] }, { results: [{ value: "s" }] }],
  }) as unknown as D1Database;
  const ctx = { waitUntil: () => {} };
  const req = (ua: string, extra: Record<string, string> = {}, method = "GET") => new Request("https://shop.test/p/x", { method, headers: { "user-agent": ua, "cf-connecting-ip": "1.2.3.4", ...extra } });
  const rows = [{ id: "1", kind: "vid", value: VID, visitorId: VID }];

  it("redirects a blocked cookie to Google with no-store and re-stamps he_vid", async () => {
    invalidateBlocks();
    const r = await edgeBlock(req(CHROME_ANDROID, { cookie: `he_vid=${VID}` }), "/p/x", { DB: db(rows) }, ctx);
    expect(r?.status).toBe(302);
    expect(r?.headers.get("location")).toBe("https://www.google.com/");
    expect(r?.headers.get("cache-control")).toBe("no-store");
    expect(r?.headers.get("set-cookie")).toContain(`he_vid=${VID}`);
    expect(r?.headers.get("set-cookie")).toMatch(/Max-Age=31536000.*HttpOnly.*SameSite=Lax.*Secure/);
  });
  it("catches a cleared cookie via IP + device class, but not another device class on the same IP", async () => {
    invalidateBlocks();
    const ipua = await ipuaHash("1.2.3.4", CHROME_ANDROID, "s");
    const d = db([{ id: "3", kind: "ipua", value: ipua, visitorId: VID }]);
    expect((await edgeBlock(req(CHROME_ANDROID), "/", { DB: d }, ctx))?.status).toBe(302);
    expect(await edgeBlock(req(SAFARI_IOS), "/", { DB: d }, ctx)).toBeNull();
  });
  it("skips bots, non-documents, non-GET, admin/api paths and staff sessions", async () => {
    invalidateBlocks();
    const d = db(rows);
    const c = { cookie: `he_vid=${VID}` };
    expect(await edgeBlock(req(BOT, c), "/", { DB: d }, ctx)).toBeNull();
    expect(await edgeBlock(req(CHROME_ANDROID, c, "POST"), "/", { DB: d }, ctx)).toBeNull();
    for (const p of ["/admin", "/admin/orders", "/api/visit", "/_next/static/a.js", "/files/a", "/sw.js", "/sitemap.xml", "/robots.txt", "/offline", "/img/a.png"]) {
      expect(EDGE_SKIP.test(p)).toBe(true);
      expect(await edgeBlock(req(CHROME_ANDROID, c), p, { DB: d }, ctx)).toBeNull();
    }
    expect(EDGE_SKIP.test("/p/some-product")).toBe(false);
    invalidateBlocks();
    expect(await edgeBlock(req(CHROME_ANDROID, { cookie: `he_vid=${VID}; he_session=tok` }), "/", { DB: db(rows, true) }, ctx)).toBeNull();
  });
  it("googleRedirect is a plain 302", () => {
    const r = googleRedirect();
    expect([r.status, r.headers.get("location")]).toEqual([302, "https://www.google.com/"]);
  });
});
