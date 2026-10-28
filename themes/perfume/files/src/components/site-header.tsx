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

/** Classic maison header: plum message strip, centred serif wordmark between search and utilities, then a centred nav. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop") }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })), { href: "/track", label: t("nav.track") }];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      {ann && <div className="eyebrow bg-[var(--panel)] px-4 py-2 text-center">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:h-20 sm:px-6">
        <div className="flex items-center gap-1">
          <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
          <form action="/shop" role="search" className="hidden lg:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="w-52 border-0 border-b border-line bg-transparent py-2 ps-7 text-sm outline-none focus:border-[var(--gold)]" /></label></form>
        </div>
        <Link href="/" className="heading text-center text-[1.6rem] italic sm:text-[2.1rem]" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="brand-logo mx-auto h-9 w-auto max-w-48 object-contain sm:h-11" height={44} />
          ) : <span dir="auto" className="block max-w-[11rem] truncate sm:max-w-sm">{s.store.name}</span>}
        </Link>
        <div className="flex items-center justify-end gap-0.5">
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 lg:hidden"><Search className="size-5" strokeWidth={1.5} /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" strokeWidth={1.5} /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
      <nav aria-label="Main" className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-9 px-5 py-3">
          {links.slice(0, -1).map((l, i) => <li key={l.href}><Link href={l.href} className={`eyebrow !tracking-[0.2em] hover:underline underline-offset-8 ${i === 0 ? "" : "!text-muted hover:!text-ink"}`}>{l.label}</Link></li>)}
        </ul>
      </nav>
    </header>
  );
}
