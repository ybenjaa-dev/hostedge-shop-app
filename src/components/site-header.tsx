import Link from "next/link";
import { Search, PackageSearch } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Gallery header: black message strip, then wordmark / centred caps nav / utilities on a hairline. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop") }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })), { href: "/track", label: t("nav.track") }];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      {ann && <div className="caps bg-[#0b0b0b] px-4 py-2 text-center text-[#e9dcc0]">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto grid h-16 max-w-[88rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:h-[4.5rem] sm:px-6">
        <div className="flex items-center gap-1">
          <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} searchLabel={t("shop.searchPh")} />
          <Link href="/" className="heading text-xl tracking-[0.22em] sm:text-[1.6rem]" aria-label={s.store.name}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={s.store.name} className="h-8 w-auto max-w-44 object-contain sm:h-10" height={40} />
            ) : <span dir="auto" className="block max-w-[9.5rem] truncate uppercase sm:max-w-xs">{s.store.name}</span>}
          </Link>
        </div>
        <nav aria-label="Main" className="hidden items-center justify-center gap-9 lg:flex">
          {links.slice(0, -1).map((l, i) => <Link key={l.href} href={l.href} className={`caps underline-offset-[10px] hover:underline decoration-[var(--champagne)] ${i === 0 ? "" : "text-muted hover:!text-ink"}`}>{l.label}</Link>)}
        </nav>
        <div className="flex items-center justify-end gap-0.5 lg:col-start-3">
          <form action="/shop" role="search" className="hidden xl:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="w-40 border-0 border-b border-line bg-transparent py-2 ps-6 text-sm outline-none focus:border-[var(--champagne)]" /></label></form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 xl:hidden"><Search className="size-5" strokeWidth={1.4} /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" strokeWidth={1.4} /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
