"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Download, Search, X, Clock } from "lucide-react";
import { getFp } from "@/lib/fingerprint-client";

type Boot = { lang: string; dir: string; store: string; icon: string; pwa: boolean; visitors: boolean; push: boolean; pushKey: string; pushDelaySec: number; labels: Record<string, string> };
let bootP: Promise<Boot | null> | null = null;
const loadBoot = () => (bootP ??= fetch("/api/boot").then((r) => (r.ok ? (r.json() as Promise<Boot>) : null)).catch(() => null));
const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const skip = (p: string) => /^\/(admin|setup|api|track)(\/|$)/.test(p);

/** Mounted once for the whole storefront. Does nothing on the admin, the wizard or the API. */
export function ClientBoot() {
  const path = usePathname();
  const [boot, setBoot] = useState<Boot | null>(null);
  useEffect(() => { if (!skip(path)) void loadBoot().then(setBoot); }, [path]);
  if (skip(path) || !boot) return null;
  return (
    <>
      <SearchSuggest boot={boot} />
      {boot.pwa && <PwaBoot boot={boot} path={path} />}
      {boot.visitors && <VisitorBoot boot={boot} path={path} />}
    </>
  );
}

/* ───────── instant search ───────── */
type Sug = { products: { slug: string; name: string; image: string | null; price: string; was: string | null }[]; categories: { slug: string; name: string }[] };
const RECENT = "he_recent_q";
const recent = (): string[] => { try { return JSON.parse(ls.get(RECENT) ?? "[]") as string[]; } catch { return []; } };

function SearchSuggest({ boot }: { boot: Boot }) {
  const L = boot.labels;
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [q, setQ] = useState("");
  const [data, setData] = useState<Sug | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [hi, setHi] = useState(-1);
  const [rec, setRec] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    const isSearch = (el: EventTarget | null): el is HTMLInputElement =>
      el instanceof HTMLInputElement && (el.type === "search" || el.name === "q") && !el.closest("[data-no-suggest]");
    const focus = (e: FocusEvent) => { if (isSearch(e.target)) { setInput(e.target); setQ(e.target.value); setRec(recent()); setHi(-1); setRect(e.target.getBoundingClientRect()); } };
    const down = (e: Event) => { if (panel.current?.contains(e.target as Node) || isSearch(e.target)) return; setInput(null); };
    const submit = (e: Event) => {
      const f = e.target as HTMLFormElement; const i = f.querySelector<HTMLInputElement>("input[type=search],input[name=q]");
      const v = i?.value.trim(); if (v) ls.set(RECENT, JSON.stringify([v, ...recent().filter((x) => x !== v)].slice(0, 6)));
    };
    document.addEventListener("focusin", focus); document.addEventListener("pointerdown", down); document.addEventListener("submit", submit, true);
    return () => { document.removeEventListener("focusin", focus); document.removeEventListener("pointerdown", down); document.removeEventListener("submit", submit, true); };
  }, []);

  useEffect(() => {
    if (!input) return;
    const on = () => { setQ(input.value); setHi(-1); setRect(input.getBoundingClientRect()); };
    const key = (e: KeyboardEvent) => {
      const links = panel.current?.querySelectorAll<HTMLAnchorElement>("a[data-s]") ?? [];
      if (e.key === "Escape") setInput(null);
      else if (e.key === "ArrowDown" && links.length) { e.preventDefault(); setHi((h) => (h + 1) % links.length); }
      else if (e.key === "ArrowUp" && links.length) { e.preventDefault(); setHi((h) => (h <= 0 ? links.length - 1 : h - 1)); }
      else if (e.key === "Enter" && hiRef.current >= 0 && links[hiRef.current]) { e.preventDefault(); links[hiRef.current]!.click(); }
    };
    const move = () => setRect(input.getBoundingClientRect());
    input.addEventListener("input", on); input.addEventListener("keydown", key);
    window.addEventListener("resize", move); window.addEventListener("scroll", move, { passive: true });
    return () => { input.removeEventListener("input", on); input.removeEventListener("keydown", key); window.removeEventListener("resize", move); window.removeEventListener("scroll", move); };
  }, [input]);
  const hiRef = useRef(-1); hiRef.current = hi;

  useEffect(() => {
    if (!input || q.trim().length < 2) { setData(null); return; }
    const n = ++seq.current;
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`); if (r.ok && n === seq.current) setData((await r.json()) as Sug); } catch { /* offline */ }
    }, 140);
    return () => clearTimeout(t);
  }, [q, input]);

  if (!input || !rect) return null;
  const typed = q.trim().length >= 2;
  const empty = typed && data && !data.products.length && !data.categories.length;
  const w = Math.max(rect.width, 300);
  const left = boot.dir === "rtl" ? Math.max(8, rect.right - w) : Math.min(rect.left, window.innerWidth - w - 8);
  let idx = -1;
  const a = (href: string, cls: string, kids: React.ReactNode) => { idx++; return <a key={href} data-s href={href} onClick={() => setInput(null)} className={`${cls} ${idx === hi ? "bg-sunken" : ""}`}>{kids}</a>; };
  return (
    <div ref={panel} dir={boot.dir} style={{ top: rect.bottom + 6, left, width: Math.min(w, window.innerWidth - 16) }}
      className="fixed z-[90] max-h-[70dvh] overflow-auto rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-2xl">
      {!typed && rec.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            {L["search.suggest.recent"]}
            <button type="button" className="font-semibold normal-case underline" onClick={() => { ls.set(RECENT, "[]"); setRec([]); }}>{L["search.suggest.clear"]}</button>
          </div>
          {rec.map((r) => a(`/shop?q=${encodeURIComponent(r)}`, "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-sunken", <><Clock className="size-4 text-muted" aria-hidden />{r}</>))}
        </div>
      )}
      {typed && data && data.categories.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted">{L["search.suggest.categories"]}</div>
          {data.categories.map((c) => a(`/shop?category=${encodeURIComponent(c.slug)}`, "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium hover:bg-sunken", <><Search className="size-4 text-muted" aria-hidden />{c.name}</>))}
        </div>
      )}
      {typed && data && data.products.length > 0 && (
        <div>
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted">{L["search.suggest.products"]}</div>
          {data.products.map((p) => a(`/p/${p.slug}`, "flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-sunken",
            <>
              {p.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/files/${p.image}?w=96`} alt="" width={44} height={44} loading="lazy" className="size-11 shrink-0 rounded-lg bg-sunken object-cover" /> : <span className="size-11 shrink-0 rounded-lg bg-sunken" />}
              <span className="min-w-0 flex-1"><span className="line-clamp-1 text-sm font-semibold">{p.name}</span>
                <span className="text-xs"><b className="text-brand">{p.price}</b>{p.was && <s className="ms-1.5 text-muted">{p.was}</s>}</span></span>
            </>))}
        </div>
      )}
      {empty && <p className="px-3 py-4 text-center text-sm text-muted">{L["search.suggest.none"]}</p>}
      {typed && a(`/shop?q=${encodeURIComponent(q.trim())}`, "mt-1 block rounded-xl border-t border-line px-3 py-2.5 text-center text-sm font-bold text-brand hover:bg-sunken", (L["search.suggest.all"] ?? "").replace("{q}", q.trim()))}
    </div>
  );
}

/* ───────── installable app ───────── */
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
function PwaBoot({ boot, path }: { boot: Boot; path: string }) {
  const L = boot.labels;
  const [ev, setEv] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    const h = (e: Event) => { e.preventDefault(); setEv(e as BIP); };
    window.addEventListener("beforeinstallprompt", h);
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone;
    setIos(isIos);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  // offer the install after the second page view, never again for 30 days once dismissed
  useEffect(() => {
    const n = Number(ls.get("he_pv") ?? 0) + 1; ls.set("he_pv", String(n));
    const dismissed = Number(ls.get("he_pwa_no") ?? 0);
    if (n >= 2 && Date.now() - dismissed > 30 * 864e5) { const t = setTimeout(() => setShow(true), 4000); return () => clearTimeout(t); }
  }, [path]);
  if (!show || !(ev || ios)) return null;
  const close = () => { ls.set("he_pwa_no", String(Date.now())); setShow(false); };
  return (
    <div dir={boot.dir} className="fixed inset-x-3 bottom-24 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-ink shadow-2xl md:bottom-6 md:start-4 md:mx-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {boot.icon ? <img src={boot.icon} alt="" width={44} height={44} className="size-11 shrink-0 rounded-xl object-cover" /> : <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink"><Download className="size-5" /></span>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{L["pwa.install"]}</p>
        <p className="text-xs text-muted">{ev ? L["pwa.installSub"] : L["pwa.iosHint"]}</p>
      </div>
      {ev && <button type="button" className="btn btn-primary btn-sm" onClick={async () => { await ev.prompt(); await ev.userChoice; setEv(null); close(); }}>{L["pwa.install"]}</button>}
      <button type="button" aria-label={L["pwa.later"]} className="btn btn-ghost btn-sm !px-2" onClick={close}><X className="size-4" /></button>
    </div>
  );
}

/* ───────── visitor beacon, push opt-in ───────── */
const b64uToBytes = (s: string) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };

function VisitorBoot({ boot, path }: { boot: Boot; path: string }) {
  const L = boot.labels;
  const [askPush, setAskPush] = useState(false);
  const [msg, setMsg] = useState("");

  // one anonymous beacon per page view
  useEffect(() => {
    let live = true;
    void (async () => {
      const q = new URLSearchParams(location.search); const utm: Record<string, string> = {};
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "ttclid", "fbclid", "gclid"]) { const v = q.get(k); if (v) utm[k] = v.slice(0, 80); }
      const fp = await getFp().catch(() => "");
      if (!live) return;
      if (fp) ls.set("he_fp", fp);
      void fetch("/api/visit", { method: "POST", headers: { "content-type": "application/json" }, keepalive: true,
        body: JSON.stringify({ fp, path, referrer: document.referrer.slice(0, 200), lang: boot.lang, screen: `${screen.width}x${screen.height}`, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, utm }) }).then((r) => r.json() as Promise<{ blocked?: boolean }>).then((j) => { if (j?.blocked) location.replace("https://www.google.com/"); }).catch(() => {});
    })();
    return () => { live = false; };
  }, [path, boot.lang]);

  // push prompt — shown as soon as the visitor scrolls, never on the checkout pages, never twice in 14 days
  useEffect(() => {
    if (!boot.push || !("PushManager" in window) || !("serviceWorker" in navigator) || Notification.permission !== "default") return;
    if (/^\/(checkout|cart|order)/.test(path)) return;
    if (Date.now() - Number(ls.get("he_push_no") ?? 0) < 14 * 864e5) return;
    const onScroll = () => { if (scrollY > 200) { setAskPush(true); window.removeEventListener("scroll", onScroll); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [boot.push, path]);

  const enable = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setMsg(L["push.denied"] ?? ""); ls.set("he_push_no", String(Date.now())); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(boot.pushKey) as BufferSource }));
      const j = sub.toJSON();
      await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, lang: boot.lang }) });
      setMsg(L["push.thanks"] ?? ""); setTimeout(() => setAskPush(false), 2500);
    } catch { setAskPush(false); }
  };
  const close = () => { ls.set("he_push_no", String(Date.now())); setAskPush(false); };

  if (!askPush) return null;
  return (
    <div role="dialog" aria-label={L["push.ask"]} dir={boot.dir} className="fixed inset-x-3 bottom-24 z-[80] mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 text-ink shadow-2xl md:bottom-6 md:start-4 md:mx-0">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink"><Bell className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{msg || L["push.ask"]}</p>
          {!msg && <p className="mt-0.5 text-xs text-muted">{L["push.askSub"]}</p>}
        </div>
        <button type="button" aria-label={L["pwa.later"]} className="btn btn-ghost btn-sm !px-2" onClick={close}><X className="size-4" /></button>
      </div>
      {!msg && <div className="mt-3 flex gap-2"><button type="button" className="btn btn-primary btn-sm flex-1" onClick={enable}>{L["push.on"]}</button><button type="button" className="btn btn-ghost btn-sm" onClick={close}>{L["pwa.later"]}</button></div>}
    </div>
  );
}
