import Link from "next/link";
import { Search, PackageSearch, Home, Package } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { roomIcon } from "@/lib/goal-icon";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** One airy row: wordmark, room pills, search pill and utilities. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const rooms = categories.map((c) => { const I = roomIcon(`${c.slug} ${tr(c.name, lang)}`); return { href: `/category/${c.slug}`, label: tr(c.name, lang), icon: <I className="size-5" /> }; });
  const links = [{ href: "/shop", label: t("nav.shop"), icon: <Home className="size-5" /> }, ...rooms, { href: "/track", label: t("nav.track"), icon: <Package className="size-5" /> }];
  return (
    <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-lg">
      {ann && <div className="bg-[var(--moss)] px-4 py-2 text-center text-xs font-semibold text-white/90 sm:text-sm">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:h-[4.5rem] sm:px-6">
        <MobileMenu links={links} title={t("home.rooms")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
        <Link href="/" className="heading shrink-0 text-2xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-9 w-auto max-w-44 object-contain" height={36} />
          ) : <span dir="auto" className="block max-w-[10rem] truncate sm:max-w-xs">{s.store.name}</span>}
        </Link>
        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 lg:flex">
          {links.slice(0, -1).map((l, i) => <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm hover:bg-sunken ${i === 0 ? "font-bold" : "font-medium text-muted hover:text-ink"}`}>{l.label}</Link>)}
        </nav>
        <div className="ms-auto flex items-center gap-1 lg:ms-0">
          <form action="/shop" role="search" className="hidden xl:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-48 !rounded-full ps-10" /></label></form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 xl:hidden"><Search className="size-5" /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
