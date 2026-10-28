"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/toast";

type Fresh = { id: string; number: string; name: string; city: string; total: number; currency: string; createdAt: number };
const KEY_MUTE = "admin.orderSound.muted", KEY_SEEN = "admin.orderSeen";
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

/** Polls for new orders: pip sound + toast + (optional) desktop notification + tab title; reports the pending count for the menu badge. */
export function OrderNotifier({ onPending }: { onPending: (n: number) => void }) {
  const toast = useToast();
  const [muted, setMuted] = useState(false);
  const [fresh, setFresh] = useState(0);
  const ctx = useRef<AudioContext | null>(null);
  const seen = useRef<number>(0);
  const baseTitle = useRef("");
  const mutedRef = useRef(false);

  useEffect(() => { const m = safe(() => localStorage.getItem(KEY_MUTE) === "1", false); setMuted(m); mutedRef.current = m; baseTitle.current = document.title; }, []);

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
        const r = await fetch(`/api/admin/notifications?since=${seen.current}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { now: number; orders: Fresh[]; pending: number };
        onPending(j.pending);
        if (j.orders.length) {
          seen.current = Math.max(...j.orders.map((o) => o.createdAt));
          safe(() => sessionStorage.setItem(KEY_SEEN, String(seen.current)), undefined);
          play();
          const o = j.orders[0]!;
          toast("success", j.orders.length === 1 ? `New order #${o.number} — ${o.name}, ${o.city}` : `${j.orders.length} new orders — latest #${o.number}`);
          setFresh((n) => n + j.orders.length);
          if ("Notification" in window && Notification.permission === "granted") safe(() => new Notification(`New order #${o.number}`, { body: `${o.name} · ${o.city}`, tag: "hostedge-order" }), undefined);
        }
      } catch { /* offline — try again next tick */ }
    };
    void tick();
    const id = setInterval(tick, 15_000);
    const vis = () => { if (!document.hidden) { void tick(); setFresh(0); } };
    document.addEventListener("visibilitychange", vis);
    return () => { stop = true; clearInterval(id); document.removeEventListener("visibilitychange", vis); };
  }, [onPending, play, toast]);

  useEffect(() => { document.title = fresh > 0 && baseTitle.current ? `(${fresh}) New order · ${baseTitle.current}` : baseTitle.current || document.title; }, [fresh]);

  const toggle = () => {
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
  return (
    <div className="flex items-center">
      <button type="button" onClick={toggle} className="btn btn-ghost btn-sm relative" aria-pressed={!muted} aria-label={muted ? "Turn on order sound" : "Turn off order sound"} title={muted ? "Order sound is off — click to turn on" : "Order sound is on"}>
        {muted ? <BellOff className="size-4" aria-hidden /> : <Bell className="size-4" aria-hidden />}
        {fresh > 0 && <span className="absolute -end-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-extrabold text-white">{fresh}</span>}
      </button>
      {fresh > 0 && <Link href="/admin/orders" onClick={() => setFresh(0)} className="sr-only focus:not-sr-only">View new orders</Link>}
    </div>
  );
}
