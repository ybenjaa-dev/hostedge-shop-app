import { describe, expect, it } from "vitest";
import { b64u, encryptPayload, generateVapid, sendPush, unb64u, vapidAuthorization } from "@/features/push/webpush";

// RFC 8291 appendix A — the one published end-to-end test vector for aes128gcm Web Push.
describe("RFC 8291 test vector", () => {
  it("encrypts to exactly the published ciphertext", async () => {
    const asPublic = unb64u("BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8");
    const asPrivJwk = { kty: "EC", crv: "P-256", d: "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw", x: b64u(asPublic.slice(1, 33)), y: b64u(asPublic.slice(33, 65)) };
    const priv = await crypto.subtle.importKey("jwk", asPrivJwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const pub = await crypto.subtle.importKey("raw", asPublic as BufferSource, { name: "ECDH", namedCurve: "P-256" }, true, []);
    const out = await encryptPayload(new TextEncoder().encode("When I grow up, I want to be a watermelon"),
      unb64u("BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"), unb64u("BTBZMqHH6r4Tts7J_aSIgg"),
      { asKeys: { privateKey: priv, publicKey: pub }, salt: unb64u("DGv6ra1nlYgDCS1FRnbzlw") });
    expect(b64u(out)).toBe("DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN");
  });
});

describe("VAPID + sending", () => {
  it("signs a verifiable ES256 token for the endpoint's origin", async () => {
    const keys = await generateVapid();
    const hdr = await vapidAuthorization("https://fcm.googleapis.com/fcm/send/abc", keys, "mailto:a@b.co", 3600, 1_700_000_000);
    const [t, k] = hdr.replace("vapid ", "").split(", ").map((x) => x.slice(2));
    expect(k).toBe(keys.publicKey);
    const [h, c, s] = t!.split(".");
    expect(JSON.parse(new TextDecoder().decode(unb64u(c!)))).toEqual({ aud: "https://fcm.googleapis.com", exp: 1_700_003_600, sub: "mailto:a@b.co" });
    const pub = await crypto.subtle.importKey("raw", unb64u(keys.publicKey) as BufferSource, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    expect(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, unb64u(s!) as BufferSource, new TextEncoder().encode(`${h}.${c}`))).toBe(true);
  });
  it("posts an encrypted body with the right headers and reports dead subscriptions", async () => {
    const keys = await generateVapid();
    const ua = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const target = { endpoint: "https://push.example/send/1", p256dh: b64u(await crypto.subtle.exportKey("raw", ua.publicKey)), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) };
    let seen: { headers: Record<string, string>; len: number } | null = null;
    const fake = (async (_u: string, init: RequestInit) => { seen = { headers: init.headers as Record<string, string>, len: (init.body as Uint8Array).length }; return new Response(null, { status: 410 }); }) as unknown as typeof fetch;
    const r = await sendPush(target, { title: "Hi", body: "There" }, keys, "mailto:a@b.co", fake);
    expect(r).toEqual({ ok: false, status: 410, gone: true });
    expect(seen!.headers["Content-Encoding"]).toBe("aes128gcm");
    expect(seen!.headers.Authorization.startsWith("vapid t=")).toBe(true);
    expect(seen!.len).toBeGreaterThan(100);
  });
});
