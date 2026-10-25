"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { NAV, type NavItem } from "../nav";
import { can, ROLE_INFO, type Role } from "@/lib/permissions";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrderNotifier } from "./order-notifier";

type Ic = React.ComponentType<{ className?: string }>;
const icon = (n: string) => ((Icons as unknown as Record<string, Ic>)[n] ?? Icons.Circle);

export function AdminChrome({ role, userName, storeName, logout, children }: { role: Role; userName: string; storeName: string; logout: () => Promise<void>; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState(false);
  const [pending, setPending] = useState(0);
  const items = NAV.filter((n) => (n.owner ? role === "owner" : can(role, n.perm)));
  const groups = [...new Set(items.map((i) => i.group))];
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd(true); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const active = (n: NavItem) => (n.href === "/admin" ? path === "/admin" : path.startsWith(n.href));

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Admin">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1 px-3 text-[11px] font-extrabold uppercase tracking-widest text-muted">{g}</p>
          {items.filter((i) => i.group === g).map((n) => {
            const I = icon(n.icon);
            return (
              <Link key={n.href} href={n.href} aria-current={active(n) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${active(n) ? "bg-brand text-brand-ink" : "text-ink/80 hover:bg-sunken"}`}>
                <I className="size-[1.1rem] shrink-0" />{n.label}{n.href === "/admin/orders" && pending > 0 && <span className={`num ms-auto rounded-full px-1.5 py-0.5 text-[11px] font-extrabold leading-none ${active(n) ? "bg-brand-ink/20" : "bg-brand text-brand-ink"}`}>{pending}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-sunken/50 lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-surface lg:flex">
        <Link href="/admin" className="display flex h-16 items-center border-b border-line px-6 text-lg font-extrabold">{storeName}</Link>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 animate-fade flex-col bg-surface shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-5"><span className="display text-lg font-extrabold">{storeName}</span><button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Close menu"><Icons.X className="size-5" /></button></div>
            {nav}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/90 px-4 backdrop-blur">
          <button className="btn btn-ghost btn-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Icons.Menu className="size-5" /></button>
          <button onClick={() => setCmd(true)} className="btn btn-outline btn-sm min-w-0 flex-1 justify-start gap-2 font-normal text-muted sm:max-w-xs sm:flex-none"><Icons.Search className="size-4" /><span className="truncate">Search…</span><kbd className="ms-auto hidden rounded border border-line px-1.5 text-[11px] sm:block">Ctrl K</kbd></button>
          <div className="ms-auto flex items-center gap-1">
            <Link href="/" target="_blank" className="btn btn-ghost btn-sm hidden sm:inline-flex"><Icons.ExternalLink className="size-4" />View store</Link>
            {can(role, "orders.view") && <OrderNotifier onPending={setPending} />}
            <ThemeToggle />
            <ProfileMenu userName={userName} role={role} logout={logout} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
      </div>
      {cmd && <CommandPalette items={items} onClose={() => setCmd(false)} />}
    </div>
  );
}

function ProfileMenu({ userName, role, logout }: { userName: string; role: Role; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" className="btn btn-ghost btn-sm gap-2" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="grid size-7 place-items-center rounded-full bg-brand text-xs font-extrabold text-brand-ink">{userName.slice(0, 1).toUpperCase()}</span><span className="hidden sm:inline">{userName}</span>
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-50 mt-1 w-48 rounded-xl border border-line bg-surface p-1 shadow-xl">
          <p className="px-3 py-2 text-xs text-muted">{ROLE_INFO[role]?.label ?? role}</p>
          <Link role="menuitem" href="/admin/team/account" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sunken"><Icons.UserCog className="size-4" />My account</Link>
          <form action={logout}><button role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sunken"><Icons.LogOut className="size-4" />Sign out</button></form>
        </div>
      )}
    </div>
  );
}

function CommandPalette({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const n = q.trim();
  const results: { label: string; href: string }[] = [
    ...(n ? [{ label: `Search orders for “${n}”`, href: `/admin/orders?q=${encodeURIComponent(n)}` }, { label: `Search products for “${n}”`, href: `/admin/products?q=${encodeURIComponent(n)}` }, { label: `Search customers for “${n}”`, href: `/admin/customers?q=${encodeURIComponent(n)}` }] : []),
    ...items.filter((x) => x.label.toLowerCase().includes(n.toLowerCase())).map((x) => ({ label: `Go to ${x.label}`, href: x.href })),
  ];
  const go = (href: string) => { onClose(); window.location.assign(href); };
  return (
    <div className="fixed inset-0 z-[90] grid place-items-start justify-items-center bg-black/50 px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command search" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setI(0); }} placeholder="Search orders, products, customers or jump to…" className="w-full border-b border-line bg-transparent px-5 py-4 text-base outline-none"
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); else if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, results.length - 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(0, x - 1)); } else if (e.key === "Enter" && results[i]) go(results[i]!.href); }} />
        <ul className="max-h-80 overflow-auto p-2">{results.map((r, k) => <li key={r.href}><button className={`w-full rounded-lg px-3 py-2.5 text-start text-sm ${k === i ? "bg-sunken font-semibold" : ""}`} onMouseEnter={() => setI(k)} onClick={() => go(r.href)}>{r.label}</button></li>)}</ul>
      </div>
    </div>
  );
}
