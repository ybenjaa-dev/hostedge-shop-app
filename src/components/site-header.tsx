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

/** Quiet editorial header: slim message strip, centered serif logo, letter-spaced nav on the side. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop") }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })), { href: "/track", label: t("nav.track") }];
  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-md">
      {ann && (
        <div className="bg-brand px-4 py-1.5 text-center text-[0.72rem] font-semibold tracking-[0.14em] text-brand-ink">
          {s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}
        </div>
      )}
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line/70 px-3 sm:h-[4.5rem] sm:px-6">
        <div className="flex items-center gap-1">
          <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            <Link href="/shop" className="eyebrow !text-ink hover:!text-brand">{t("nav.shop")}</Link>
            {categories.slice(0, 3).map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="eyebrow hover:!text-brand">{tr(c.name, lang)}</Link>)}
          </nav>
        </div>
        <Link href="/" className="display flex items-center justify-center text-[1.7rem] italic sm:text-[2.1rem]" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-9 w-auto max-w-44 object-contain sm:h-11" height={44} />
          ) : (
            <span dir="auto" className="max-w-[11rem] truncate sm:max-w-xs">{s.store.name}</span>
          )}
        </Link>
        <div className="flex items-center justify-end gap-0.5">
          <form action="/shop" role="search" className="hidden xl:block">
            <label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-44 !rounded-full !py-1.5 ps-9 text-sm" /></label>
          </form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 xl:hidden"><Search className="size-5" strokeWidth={1.5} /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" strokeWidth={1.5} /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
