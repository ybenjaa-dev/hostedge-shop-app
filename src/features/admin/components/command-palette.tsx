"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { Avatar } from "@/components/avatar";
import { can, type Role } from "@/lib/permissions";
import type { NavItem } from "../nav";
import { fileUrl } from "@/lib/storage";

type Hit = { group: "orders" | "products" | "customers" | "visitors"; title: string; sub: string; href: string; image?: string | null; badge?: { label: string; color: string } | null; right?: string };
type Row = { key: string; group: string; title: string; sub?: string; href: string; icon?: string; image?: string | null; badge?: Hit["badge"]; right?: string };
type Ic = React.ComponentType<{ className?: string }>;
const icon = (n: string): Ic => ((Icons as unknown as Record<string, Ic>)[n] ?? Icons.Circle);
const GROUP: Record<string, { label: string; icon: string }> = { orders: { label: "Orders", icon: "ShoppingBag" }, products: { label: "Products", icon: "Package" }, customers: { label: "Customers", icon: "Users" }, visitors: { label: "Visitors", icon: "Radar" }, actions: { label: "Quick actions", icon: "Zap" }, pages: { label: "Go to", icon: "CornerDownRight" }, recent: { label: "Recent searches", icon: "Clock" } };
const ACTIONS: { label: string; href: string; icon: string; perm: Parameters<typeof can>[1] }[] = [
  { label: "Add a product", href: "/admin/products/new", icon: "PackagePlus", perm: "products.edit" },
  { label: "Create a coupon", href: "/admin/coupons", icon: "Ticket", perm: "coupons.manage" },
  { label: "Upload to the media library", href: "/admin/media", icon: "ImagePlus", perm: "media.manage" },
  { label: "Send a push notification", href: "/admin/push", icon: "BellRing", perm: "push.send" },
  { label: "Orders waiting for confirmation", href: "/admin/orders?status=pending_confirmation", icon: "PhoneCall", perm: "orders.confirm" },
  { label: "Edit the storefront design", href: "/admin/appearance", icon: "Palette", perm: "appearance.edit" },
];
const RECENT = "he_admin_recent";
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT) ?? "[]") as string[]; } catch { return []; } };

const Mark = ({ text, q }: { text: string; q: string }) => {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  return i < 0 ? <>{text}</> : <>{text.slice(0, i)}<mark className="rounded bg-brand-soft px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
};

/** Ctrl/⌘ K: live search across orders, products, customers and visitors, plus pages and quick actions — all filtered by the signed-in role. */
export function CommandPalette({ items, role, onClose }: { items: NavItem[]; role: Role; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const seq = useRef(0);
  useEffect(() => { input.current?.focus(); setRecent(readRecent()); document.documentElement.style.overflow = "hidden"; return () => { document.documentElement.style.overflow = ""; }; }, []);
  const n = q.trim();

  useEffect(() => {
    if (n.length < 2) { setHits([]); setBusy(false); return; }
    setBusy(true);
    const my = ++seq.current;
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/admin/search?q=${encodeURIComponent(n)}`); const j = (await r.json()) as { hits: Hit[] }; if (my === seq.current) setHits(j.hits ?? []); } catch { /* offline */ }
      if (my === seq.current) setBusy(false);
    }, 160);
    return () => clearTimeout(t);
  }, [n]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const low = n.toLowerCase();
    if (!n) {
      recent.forEach((r) => out.push({ key: `r-${r}`, group: "recent", title: r, href: `#q:${r}`, icon: "Search" }));
      ACTIONS.filter((a) => can(role, a.perm)).forEach((a) => out.push({ key: a.href, group: "actions", title: a.label, href: a.href, icon: a.icon }));
      items.forEach((x) => out.push({ key: x.href, group: "pages", title: x.label, href: x.href, icon: x.icon }));
      return out;
    }
    for (const g of ["orders", "products", "customers", "visitors"] as const) hits.filter((h) => h.group === g).forEach((h) => out.push({ key: `${g}-${h.href}`, group: g, title: h.title, sub: h.sub, href: h.href, image: h.image, badge: h.badge, right: h.right, icon: GROUP[g]!.icon }));
    ACTIONS.filter((a) => can(role, a.perm) && a.label.toLowerCase().includes(low)).forEach((a) => out.push({ key: a.href, group: "actions", title: a.label, href: a.href, icon: a.icon }));
    items.filter((x) => x.label.toLowerCase().includes(low)).forEach((x) => out.push({ key: x.href, group: "pages", title: x.label, href: x.href, icon: x.icon }));
    // always offer the full result pages for the current text
    if (can(role, "orders.view")) out.push({ key: "all-o", group: "pages", title: `All orders matching “${n}”`, href: `/admin/orders?q=${encodeURIComponent(n)}`, icon: "ShoppingBag" });
    if (can(role, "products.view")) out.push({ key: "all-p", group: "pages", title: `All products matching “${n}”`, href: `/admin/products?q=${encodeURIComponent(n)}`, icon: "Package" });
    if (can(role, "customers.view")) out.push({ key: "all-c", group: "pages", title: `All customers matching “${n}”`, href: `/admin/customers?q=${encodeURIComponent(n)}`, icon: "Users" });
    return out;
  }, [n, hits, items, role, recent]);

  useEffect(() => setI(0), [n, hits.length]);
  useEffect(() => { list.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest" }); }, [i]);

  const go = (r: Row, newTab = false) => {
    if (r.href.startsWith("#q:")) { setQ(r.href.slice(3)); input.current?.focus(); return; }
    if (n.length >= 2) { try { localStorage.setItem(RECENT, JSON.stringify([n, ...readRecent().filter((x) => x !== n)].slice(0, 5))); } catch { /* private mode */ } }
    if (newTab) { window.open(r.href, "_blank", "noopener"); return; }
    onClose(); window.location.assign(r.href);
  };
  let last = "";
  return (
    <div className="fixed inset-0 z-[90] grid place-items-start justify-items-center bg-black/50 px-3 pt-[8vh] backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Search" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[80dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          {busy ? <Icons.Loader2 className="size-5 shrink-0 animate-spin text-muted" aria-hidden /> : <Icons.Search className="size-5 shrink-0 text-muted" aria-hidden />}
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search orders, products, customers, or jump to…" aria-label="Search" role="combobox" aria-expanded aria-controls="cp-list" autoComplete="off" spellCheck={false}
            className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, rows.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
              else if (e.key === "Enter" && rows[i]) { e.preventDefault(); go(rows[i]!, e.metaKey || e.ctrlKey); }
            }} />
          {q && <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Clear" onClick={() => { setQ(""); input.current?.focus(); }}><Icons.X className="size-4" /></button>}
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] font-bold text-muted sm:block">ESC</kbd>
        </div>
        <ul id="cp-list" ref={list} role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2">
          {rows.map((r, k) => {
            const head = r.group !== last; last = r.group;
            const Ic = icon(r.icon ?? "Circle");
            return (
              <li key={r.key} role="presentation">
                {head && <p className="px-3 pb-1 pt-3 text-[11px] font-extrabold uppercase tracking-wider text-muted first:pt-1">{GROUP[r.group]?.label ?? r.group}</p>}
                <button type="button" role="option" aria-selected={k === i} data-i={k} onMouseMove={() => setI(k)} onClick={(e) => go(r, e.metaKey || e.ctrlKey)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start ${k === i ? "bg-sunken" : ""}`}>
                  {r.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(r.image, "thumb")} alt="" className="size-9 shrink-0 rounded-lg bg-sunken object-cover" />
                    : r.group === "customers" ? <Avatar name={r.title} size="md" />
                    : <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sunken text-muted"><Ic className="size-4" /></span>}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold"><Mark text={r.title} q={n} /></span>
                    {r.sub && <span className="block truncate text-xs text-muted"><Mark text={r.sub} q={n} /></span>}
                  </span>
                  {r.badge && <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${r.badge.color}1f`, color: r.badge.color }}>{r.badge.label}</span>}
                  {r.right && <span className="num shrink-0 text-xs font-semibold text-muted">{r.right}</span>}
                  {k === i && <Icons.CornerDownLeft className="size-3.5 shrink-0 text-muted" aria-hidden />}
                </button>
              </li>
            );
          })}
          {n.length >= 2 && !busy && hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No orders, products or customers match “{n}”.</li>}
        </ul>
        <div className="flex items-center gap-4 border-t border-line bg-sunken/50 px-4 py-2 text-[11px] font-semibold text-muted">
          <span><kbd className="font-bold">↑↓</kbd> move</span><span><kbd className="font-bold">↵</kbd> open</span><span><kbd className="font-bold">Ctrl ↵</kbd> new tab</span><span className="ms-auto hidden sm:inline">Tip: type a phone number, order # or product name</span>
        </div>
      </div>
    </div>
  );
}
