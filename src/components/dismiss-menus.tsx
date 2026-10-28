"use client";
import { useEffect } from "react";

/** A `<details>` that works as a menu (links only — no form fields inside), as opposed to a collapsible form panel. */
const isMenu = (d: HTMLDetailsElement) => !d.querySelector("input, select, textarea, form") && !d.hasAttribute("data-keep-open");

/**
 * Every dropdown built on <details> (the shop's mobile menu, admin dropdowns) closes when you tap anywhere else, press Escape,
 * or choose a link inside it. They need no JavaScript of their own, so the behaviour lives here, once, for all themes.
 */
export function DismissMenus() {
  useEffect(() => {
    const openMenus = () => [...document.querySelectorAll<HTMLDetailsElement>("details[open]")].filter(isMenu);
    const away = (e: Event) => { for (const d of openMenus()) if (!d.contains(e.target as Node)) d.open = false; };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") for (const d of openMenus()) { if (d.open) { d.open = false; (d.querySelector("summary") as HTMLElement | null)?.focus(); } } };
    const pick = (e: Event) => { const a = (e.target as Element).closest?.("a[href]"); if (!a) return; const d = a.closest("details"); if (d && isMenu(d as HTMLDetailsElement)) (d as HTMLDetailsElement).open = false; };
    const evs = ["pointerdown", "touchstart", "focusin"] as const;
    evs.forEach((n) => document.addEventListener(n, away, true));
    document.addEventListener("keydown", key); document.addEventListener("click", pick);
    return () => { evs.forEach((n) => document.removeEventListener(n, away, true)); document.removeEventListener("keydown", key); document.removeEventListener("click", pick); };
  }, []);
  return null;
}
