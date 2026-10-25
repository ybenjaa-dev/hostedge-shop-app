import Link from "next/link";
import { Search } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** One quiet row: nav left, wordmark centered, utilities right — under a thin black message strip. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop") }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })), { href: "/track", label: t("nav.track") }];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur">
      {ann && <div className="label-s bg-ink px-4 py-2 text-center text-bg">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto grid h-14 max-w-[88rem] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:h-16 sm:px-6">
        <div className="flex items-center gap-1">
          <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            <Link href="/shop" className="label-s hover:underline underline-offset-8">{t("nav.shop")}</Link>
            {categories.slice(0, 4).map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="label-s text-muted hover:text-ink hover:underline underline-offset-8">{tr(c.name, lang)}</Link>)}
          </nav>
        </div>
        <Link href="/" className="display text-[1.35rem] tracking-[0.12em] sm:text-2xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-8 w-auto max-w-44 object-contain sm:h-9" height={36} />
          ) : <span dir="auto" className="block max-w-[11rem] truncate sm:max-w-xs">{s.store.name}</span>}
        </Link>
        <div className="flex items-center justify-end gap-0.5">
          <form action="/shop" role="search" className="hidden xl:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-9 w-40 text-sm" /></label></form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 xl:hidden"><Search className="size-5" strokeWidth={1.5} /></Link>
          <Link href="/track" className="label-s hidden px-2 text-muted hover:text-ink sm:inline">{t("nav.track")}</Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
