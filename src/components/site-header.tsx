import Link from "next/link";
import { Menu, Search, PackageSearch } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartButton } from "@/features/checkout/components/cart-button";

export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const ann = s.announcement;
  const logo = fileUrl(s.branding.logo);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      {ann.enabled && tr(ann.text, lang) && (
        <div className="bg-secondary px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
          {ann.href ? <Link href={ann.href} className="hover:underline">{tr(ann.text, lang)}</Link> : tr(ann.text, lang)}
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <details className="relative md:hidden">
          <summary aria-label={t("nav.menu")} className="btn btn-ghost btn-sm list-none [&::-webkit-details-marker]:hidden"><Menu className="size-5" /></summary>
          <nav className="absolute start-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
            <Link href="/shop" className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-sunken">{t("nav.shop")}</Link>
            {categories.map((c) => (<Link key={c.slug} href={`/category/${c.slug}`} className="block rounded-lg px-3 py-2.5 hover:bg-sunken">{tr(c.name, lang)}</Link>))}
            <Link href="/track" className="block rounded-lg px-3 py-2.5 hover:bg-sunken">{t("nav.track")}</Link>
          </nav>
        </details>
        <Link href="/" className="display flex items-center gap-2 text-xl font-extrabold tracking-tight" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="brand-logo h-10 w-auto max-w-56 object-contain" height={40} />
          ) : (
            s.store.name
          )}
        </Link>
        <nav className="ms-4 hidden items-center gap-1 md:flex" aria-label="Main">
          <Link href="/shop" className="rounded-full px-3 py-1.5 text-sm font-bold hover:bg-sunken">{t("nav.shop")}</Link>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-muted hover:bg-sunken hover:text-ink">{tr(c.name, lang)}</Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <form action="/shop" role="search" className="hidden lg:block">
            <label className="relative block">
              <span className="sr-only">{t("nav.search")}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-52 !rounded-full !py-1.5 ps-9" />
            </label>
          </form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm lg:hidden"><Search className="size-5" /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden sm:inline-flex"><PackageSearch className="size-5" /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
