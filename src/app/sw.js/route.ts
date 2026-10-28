export const dynamic = "force-static";

const SW = `/* HostEdge storefront service worker: offline page, fast repeat visits, push notifications. */
const V = "he-v1", PAGES = V + "-pages", ASSETS = V + "-assets";
const SKIP = /^\\/(admin|api|setup|accept-invite|order|checkout|cart|track|sw\\.js|manifest)/;
const trim = async (name, max) => { const c = await caches.open(name); const keys = await c.keys(); for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]); };

self.addEventListener("install", (e) => { e.waitUntil(caches.open(PAGES).then((c) => c.add(new Request("/offline", { cache: "reload" }))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !k.startsWith(V)).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || r.headers.has("range") || SKIP.test(u.pathname)) return;
  // fingerprinted build files and uploaded pictures never change: cache first
  if (/^\\/(_next\\/static|files|brand|pwa)\\//.test(u.pathname)) {
    e.respondWith(caches.open(ASSETS).then(async (c) => { const hit = await c.match(r); if (hit) return hit; const res = await fetch(r); if (res.ok) { c.put(r, res.clone()); trim(ASSETS, 160); } return res; }));
    return;
  }
  // pages: network first (always fresh stock & prices), the last copy when the network is gone, then the offline page
  if (r.mode === "navigate") {
    e.respondWith((async () => {
      try { const res = await fetch(r); if (res.ok && res.headers.get("content-type")?.includes("text/html")) { const c = await caches.open(PAGES); c.put(r, res.clone()); trim(PAGES, 40); } return res; }
      catch { const c = await caches.open(PAGES); return (await c.match(r)) || (await c.match("/offline")) || Response.error(); }
    })());
  }
});

self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: "New message", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Notification", { body: d.body || "", icon: d.icon || undefined, badge: d.icon || undefined, image: d.image || undefined, tag: d.tag || undefined, data: { url: d.url || "/", id: d.id || null }, dir: "auto" }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const { url, id } = e.notification.data || {};
  e.waitUntil((async () => {
    if (id) fetch("/api/push/click", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }), keepalive: true }).catch(() => {});
    const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const target = new URL(url || "/", location.origin).href;
    for (const c of all) if ("focus" in c) { await c.focus(); if ("navigate" in c) return c.navigate(target); }
    return clients.openWindow(target);
  })());
});
`;

export function GET() {
  return new Response(SW, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-cache, max-age=0", "Service-Worker-Allowed": "/" } });
}
