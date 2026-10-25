"use client";
import { useSyncExternalStore } from "react";

export type CartLine = {
  key: string; // productId:variantId
  productId: string;
  variantId: string | null;
  qty: number;
  name: string; // raw i18n JSON snapshot
  variantName: string | null;
  price: number;
  image: string | null;
  slug: string;
};

const KEY = "cart.v1";
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
let drawerOpen = false;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartLine[];
  } catch {
    cache = [];
  }
  return cache;
}
function write(next: CartLine[]) {
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY);
export const useDrawerOpen = () => useSyncExternalStore(subscribe, () => drawerOpen, () => false);
export const setDrawer = (open: boolean) => { drawerOpen = open; listeners.forEach((l) => l()); };

export const cart = {
  add(line: Omit<CartLine, "key">) {
    const key = `${line.productId}:${line.variantId ?? ""}`;
    const cur = read();
    const ex = cur.find((l) => l.key === key);
    write(ex ? cur.map((l) => (l.key === key ? { ...l, qty: Math.min(99, l.qty + line.qty), price: line.price } : l)) : [...cur, { ...line, key }]);
  },
  setQty(key: string, qty: number) {
    write(read().map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l)));
  },
  remove(key: string) { write(read().filter((l) => l.key !== key)); },
  clear() { write([]); },
  /** Replace snapshots with authoritative data from the server (drops unavailable lines). */
  replace(lines: CartLine[]) { write(lines); },
};

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
