"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PackageSearch, MessageCircle, ShoppingBag } from "lucide-react";
import { whatsappLink } from "@/lib/phone";
import { cartCount, useCart } from "@/features/checkout/cart-store";

/** App-style bottom navigation for phones. Hidden where a sticky buy/checkout bar already lives. */
export function MobileTabBar({ labels, whatsapp, cartMode }: { labels: { home: string; shop: string; track: string; chat: string; cart: string }; whatsapp: string; cartMode: boolean }) {
  const path = usePathname();
  const lines = useCart();
  if (path.startsWith("/p/") || path.startsWith("/checkout") || path.startsWith("/order/")) return null;
  const items = [
    { href: "/", label: labels.home, Icon: Home, on: path === "/" },
    { href: "/shop", label: labels.shop, Icon: LayoutGrid, on: path.startsWith("/shop") || path.startsWith("/category") },
    { href: "/track", label: labels.track, Icon: PackageSearch, on: path.startsWith("/track") },
  ];
  const cls = (on: boolean) => `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.68rem] font-extrabold uppercase tracking-wide ${on ? "bg-brand text-brand-ink" : "text-ink"}`;
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-ink bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(({ href, label, Icon, on }) => (
        <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cls(on)}><Icon className="size-5" aria-hidden />{label}</Link>
      ))}
      {cartMode ? (
        <Link href="/cart" aria-current={path.startsWith("/cart") ? "page" : undefined} className={cls(path.startsWith("/cart"))}>
          <ShoppingBag className="size-5" aria-hidden />{labels.cart}
          {cartCount(lines) > 0 && <span className="num absolute end-1/4 top-1 grid min-w-4 place-items-center bg-accent px-1 text-[10px] font-extrabold leading-4 text-accent-ink">{cartCount(lines)}</span>}
        </Link>
      ) : (
        whatsapp && <a href={whatsappLink(whatsapp)} target="_blank" rel="noopener noreferrer" className={cls(false)}><MessageCircle className="size-5" aria-hidden />{labels.chat}</a>
      )}
    </nav>
  );
}
