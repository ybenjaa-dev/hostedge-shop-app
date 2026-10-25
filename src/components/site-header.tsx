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

/** Centered-logo header with a gold-trimmed announcement strip and an ornament-separated nav row. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const ann = s.announcement;
  const logo = fileUrl(s.branding.logo);
  const annText = ann.enabled ? tr(ann.text, lang) : "";
  const links = [
    { href: "/shop", label: t("nav.shop") },
    ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })),
    { href: "/track", label: t("nav.track") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-gold bg-bg/95 backdrop-blur">
      {annText && (
        <div className="bg-zel-w bg-navy px-4 py-1.5 text-center text-[0.78rem] font-bold text-[#f6efd9] sm:text-sm">
          <span className="orn !size-3 align-[-1px] text-[#e3c36f]" aria-hidden /> {ann.href ? <Link href={ann.href} className="hover:underline">{annText}</Link> : annText} <span className="orn !size-3 align-[-1px] text-[#e3c36f]" aria-hidden />
        </div>
      )}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:h-[4.5rem] sm:px-5">
        <div className="flex items-center gap-1">
          <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
          <form action="/shop" role="search" className="hidden lg:block">
            <label className="relative block">
              <span className="sr-only">{t("nav.search")}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gold" aria-hidden />
              <input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-52 !rounded-full !py-1.5 ps-9" />
            </label>
          </form>
        </div>

        <Link href="/" className="heading flex items-center justify-center gap-2.5 text-[1.6rem] leading-none sm:text-3xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-9 w-auto max-w-44 object-contain sm:h-11" height={44} />
          ) : (
            <>
              <span className="orn !size-6 sm:!size-7" aria-hidden />
              <span dir="auto" className="max-w-[9.5rem] truncate sm:max-w-xs">{s.store.name}</span>
              <span className="orn !size-6 sm:!size-7" aria-hidden />
            </>
          )}
        </Link>

        <div className="flex items-center justify-end gap-0.5">
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 lg:hidden"><Search className="size-5" /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>

      <nav className="hidden border-t border-gold/40 lg:block" aria-label="Main">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-x-1 px-4 py-2">
          {links.slice(0, 7).map((l, i) => (
            <li key={l.href} className="flex items-center gap-1">
              {i > 0 && <span className="orn !size-2.5" aria-hidden />}
              <Link href={l.href} className="heading rounded-full px-4 py-1 text-lg text-ink transition hover:bg-sunken hover:text-brand">{l.label}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
