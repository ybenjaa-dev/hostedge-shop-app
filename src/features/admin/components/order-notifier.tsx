"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Bell, BellOff, CheckCheck, PackageX, ShoppingBag, ShoppingCart, Star, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { useToast } from "@/components/toast";
import { bellCount, countUnread, isUnread, markAllSeen, timeAgo, type FeedItem, type FeedKind, type FeedResponse } from "../notification-feed";

const KEY_MUTE = "admin.orderSound.muted", KEY_SEEN = "admin.orderSeen", KEY_READ = "admin.bell.readAt.";
const POLL_MS = 20_000;
const KIND: Record<FeedKind, { Icon: LucideIcon; tone: string }> = {
  order: { Icon: ShoppingBag, tone: "bg-brand/15 text-brand" },
  abandoned: { Icon: ShoppingCart, tone: "bg-sunken text-muted" },
  stock: { Icon: PackageX, tone: "bg-danger/15 text-danger" },
  review: { Icon: Star, tone: "bg-sunken text-ink" },
  shipment: { Icon: AlertTriangle, tone: "bg-danger/15 text-danger" },
};
const safe = <T,>(fn: () => T, d: T): T => { try { return fn(); } catch { return d; } };

/** Two soft "pip"s — synthesised, so there is no audio file to ship. */
function pip(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  [[880, 0], [1318, 0.16]].forEach(([f, d]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f!;
    g.gain.setValueAtTime(0.0001, t0 + d!); g.gain.exponentialRampToValueAtTime(0.35, t0 + d! + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d! + 0.14);
    o.connect(g).connect(ctx.destination); o.start(t0 + d!); o.stop(t0 + d! + 0.16);
  });
}

/** Notification bell: polls the feed (pip sound + toast + desktop notification for new orders), shows a dropdown of recent activity. */
export function OrderNotifier({ onPending, userKey, canOrders }: { onPending: (n: number) => void; userKey: string; canOrders: boolean }) {
  const toast = useToast();
  const path = usePathname();
  const [muted, setMuted] = useState(false);
  const [fresh, setFresh] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(0);
  const [lastSeen, setLastSeen] = useState(0);
  const ctx = useRef<AudioContext | null>(null);
  const seen = useRef<number>(0);
  const baseTitle = useRef("");
  const mutedRef = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const bell = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const refresh = useRef<() => void>(() => {});

  useEffect(() => { const m = safe(() => localStorage.getItem(KEY_MUTE) === "1", false); setMuted(m); mutedRef.current = m; baseTitle.current = document.title; }, []);
  useEffect(() => { setLastSeen(Number(safe(() => localStorage.getItem(KEY_READ + userKey), null)) || 0); }, [userKey]);

  // Browsers only allow sound after the user has interacted with the page: unlock the audio context on the first click/key.
  useEffect(() => {
    const unlock = () => {
      try { ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); if (ctx.current.state === "suspended") void ctx.current.resume(); } catch { /* no audio */ }
    };
    window.addEventListener("pointerdown", unlock, { once: true }); window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, []);

  const play = useCallback(() => {
    if (mutedRef.current) return;
    try {
      ctx.current ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (ctx.current.state === "suspended") void ctx.current.resume();
      pip(ctx.current);
    } catch { /* no audio available */ }
  }, []);

  useEffect(() => {
    seen.current = Number(safe(() => sessionStorage.getItem(KEY_SEEN), null)) || Date.now();
    let stop = false;
    const tick = async () => {
      if (stop || document.hidden) return;
      try {
        const r = await fetch("/api/admin/notifications/feed", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const j = (await r.json()) as FeedResponse;
        setItems(j.items); setNow(j.now); setFailed(false);
        if (j.pending != null) onPending(j.pending);
        const orders = j.items.filter((i) => i.kind === "order" && i.at > seen.current);
        if (orders.length) {
          seen.current = Math.max(...orders.map((o) => o.at));
          safe(() => sessionStorage.setItem(KEY_SEEN, String(seen.current)), undefined);
          play();
          const o = orders[0]!;
          toast("success", orders.length === 1 ? `${o.title} — ${o.lines[0]}` : `${orders.length} new orders — latest ${o.title.replace("New order ", "")}`);
          setFresh((n) => n + orders.length);
          if ("Notification" in window && Notification.permission === "granted") safe(() => new Notification(o.title, { body: o.lines[0], tag: "hostedge-order" }), undefined);
        }
      } catch { setFailed(true); /* offline — try again next tick */ }
    };
    refresh.current = () => void tick();
    void tick();
    const id = setInterval(tick, POLL_MS);
    const vis = () => { if (!document.hidden) { void tick(); setFresh(0); } };
    document.addEventListener("visibilitychange", vis);
    return () => { stop = true; clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, [onPending, play, toast]);

  useEffect(() => { document.title = fresh > 0 && baseTitle.current ? `(${fresh}) New order · ${baseTitle.current}` : baseTitle.current || document.title; }, [fresh]);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    refresh.current();
    panel.current?.focus();
    const away = (e: Event) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); bell.current?.focus(); } };
    const evs = ["pointerdown", "mousedown", "touchstart", "focusin"] as const;
    evs.forEach((n) => document.addEventListener(n, away, true));
    document.addEventListener("keydown", key);
    return () => { evs.forEach((n) => document.removeEventListener(n, away, true)); document.removeEventListener("keydown", key); };
  }, [open]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next); mutedRef.current = next;
    safe(() => localStorage.setItem(KEY_MUTE, next ? "1" : "0"), undefined);
    if (!next) {
      // a click is the user gesture browsers need before they allow sound & notifications
      mutedRef.current = false; play();
      if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
      toast("success", "Order sound on — you’ll hear a pip for every new order while this tab is open.");
    }
  };
  const markAll = () => {
    const v = markAllSeen(items ?? [], Date.now(), lastSeen);
    setLastSeen(v); setFresh(0);
    safe(() => localStorage.setItem(KEY_READ + userKey, String(v)), undefined);
  };

  const unread = items ? countUnread(items, lastSeen) : 0;
  const itemLink = "flex items-start gap-3 px-4 py-3 text-start transition hover:bg-sunken focus-visible:bg-sunken focus-visible:outline-none";
  return (
    <div ref={wrap} className="relative flex items-center">
      <button ref={bell} type="button" onClick={() => setOpen((o) => !o)} className="btn btn-ghost btn-sm relative" aria-haspopup="dialog" aria-expanded={open} aria-controls="bell-panel"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} title={muted ? "Notifications (order sound is off)" : "Notifications"}>
        {muted ? <BellOff className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
        {unread > 0 && <span className="num absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">{bellCount(unread)}</span>}
      </button>
      {open && (
        <div id="bell-panel" ref={panel} tabIndex={-1} role="dialog" aria-label="Notifications"
          className="fixed inset-x-0 top-full z-40 flex max-h-[min(36rem,calc(100dvh-5rem))] animate-fade flex-col overflow-hidden border-b border-line bg-surface shadow-2xl focus:outline-none sm:absolute sm:inset-x-auto sm:end-0 sm:mt-2 sm:w-[26rem] sm:rounded-xl sm:border">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <h2 className="display me-auto text-base font-extrabold">Notifications{unread > 0 && <span className="num ms-2 rounded-full bg-danger px-1.5 py-0.5 align-middle text-[11px] font-extrabold leading-none text-white">{unread}</span>}</h2>
            <button type="button" role="switch" aria-checked={!muted} onClick={toggleMute} className="btn btn-ghost btn-sm gap-1.5" title={muted ? "Order sound is off — click to turn on" : "Order sound is on"}>
              {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}<span className="text-xs">Sound {muted ? "off" : "on"}</span>
            </button>
            <button type="button" onClick={markAll} disabled={unread === 0} className="btn btn-ghost btn-sm gap-1.5" title="Mark all as read"><CheckCheck className="size-4" aria-hidden /><span className="text-xs">Mark all read</span></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
            {failed && !items ? (
              <div className="px-4 py-10 text-center text-sm"><p className="font-semibold text-danger">Couldn’t load notifications</p><button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => refresh.current()}>Try again</button></div>
            ) : !items ? (
              <ul aria-busy="true" aria-label="Loading notifications">{[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex gap-3 px-4 py-3"><span className="size-9 shrink-0 animate-pulse rounded-full bg-sunken" /><span className="flex-1 space-y-2 pt-1"><span className="block h-3 w-1/2 animate-pulse rounded bg-sunken" /><span className="block h-3 w-4/5 animate-pulse rounded bg-sunken" /></span></li>
              ))}</ul>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center"><CheckCheck className="mx-auto size-8 text-muted" aria-hidden /><p className="mt-2 font-semibold">You’re all caught up</p><p className="text-sm text-muted">New orders and alerts from the last 7 days show up here.</p></div>
            ) : (
              <ul className="divide-y divide-line">
                {failed && <li className="bg-danger/10 px-4 py-2 text-xs text-danger">Couldn’t refresh — showing the last loaded list.</li>}
                {items.map((it) => {
                  const { Icon, tone } = KIND[it.kind];
                  const un = isUnread(it, lastSeen);
                  return (
                    <li key={it.key}>
                      <Link href={it.href} onClick={() => setOpen(false)} className={itemLink}>
                        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="size-4" aria-hidden /></span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2"><span className="truncate text-sm font-bold">{it.title}</span>{it.badge && <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[10px] font-bold leading-none text-muted">{it.badge}</span>}</span>
                          {it.lines.map((l, i) => <span key={i} className="block truncate text-xs text-muted">{l}</span>)}
                          <span className="num mt-0.5 block text-[11px] text-muted/80">{timeAgo(it.at, now || Date.now())}</span>
                        </span>
                        {un && <><span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-hidden /><span className="sr-only">Unread</span></>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {canOrders && <Link href="/admin/orders" onClick={() => setOpen(false)} className="border-t border-line px-4 py-3 text-center text-sm font-bold text-brand transition hover:bg-sunken">View all orders</Link>}
        </div>
      )}
    </div>
  );
}
