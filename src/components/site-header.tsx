import Link from "next/link";
import { Search, Menu, Phone, PackageSearch, LayoutGrid, ChevronDown } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { formatPhoneIntl } from "@/lib/phone";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Classic three-tier header: utility bar · logo + wide search + help · department nav. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const phone = s.store.phones.filter(Boolean)[0];
  const logoEl = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={s.store.name} className="brand-logo h-9 w-auto max-w-44 object-contain sm:h-11" height={44} />
  ) : (
    <span dir="auto" className="display text-[1.55rem] font-extrabold tracking-tight text-brand sm:text-3xl">{s.store.name}</span>
  );
  const searchForm = (idp: string) => (
    <form action="/shop" role="search" className="flex w-full">
      <label className="sr-only" htmlFor={`${idp}-q`}>{t("nav.search")}</label>
      <select name="category" aria-label={t("shop.category")} className="field hidden !w-56 shrink-0 !rounded-e-none !border-e-0 bg-sunken font-semibold md:block" defaultValue="">
        <option value="">{t("shop.allCategories")}</option>
        {categories.map((c) => <option key={c.slug} value={c.slug}>{tr(c.name, lang)}</option>)}
      </select>
      <input id={`${idp}-q`} name="q" type="search" placeholder={t("shop.searchPh")} className="field min-w-0 flex-1 md:!rounded-none" enterKeyHint="search" />
      <button className="btn btn-primary !rounded-s-none px-4" aria-label={t("common.search")}><Search className="size-5" /></button>
    </form>
  );
  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="topbar bg-secondary text-[0.8rem] text-white">
        <div className="mx-auto flex h-8 max-w-[84rem] items-center justify-between gap-3 px-3">
          <p className="min-w-0 truncate font-medium">{ann || s.store.name}</p>
          <div className="flex shrink-0 items-center">
            {phone && <a href={`tel:+${phone.replace(/\D/g, "")}`} dir="ltr" className="btn btn-ghost me-1 hidden items-center gap-1.5 sm:inline-flex"><Phone className="size-3.5" />{formatPhoneIntl(phone.replace(/\D/g, ""))}</a>}
            <Link href="/track" className="btn btn-ghost hidden sm:inline-flex"><PackageSearch className="size-3.5" />{t("nav.track")}</Link>
            <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
            <ThemeToggle className="btn btn-ghost" />
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[84rem] items-center gap-3 px-3 py-2.5 md:gap-6">
          <details className="relative md:hidden">
            <summary aria-label={t("nav.menu")} className="btn btn-outline btn-sm list-none !px-2 [&::-webkit-details-marker]:hidden"><Menu className="size-5" /></summary>
            <nav className="absolute start-0 top-full z-50 mt-2 w-72 border border-rule bg-surface shadow-lg" aria-label={t("nav.menu")}>
              <Link href="/shop" className="block border-b border-line px-4 py-3 font-bold hover:bg-sunken">{t("nav.shop")}</Link>
              {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="block border-b border-line px-4 py-3 hover:bg-sunken">{tr(c.name, lang)}</Link>)}
              <Link href="/track" className="block px-4 py-3 hover:bg-sunken">{t("nav.track")}</Link>
            </nav>
          </details>
          <Link href="/" aria-label={s.store.name} className="shrink-0">{logoEl}</Link>
          <div className="hidden flex-1 md:block">{searchForm("d")}</div>
          <div className="ms-auto flex items-center gap-2">
            {s.store.whatsapp && <p className="hidden text-end text-xs leading-tight text-muted xl:block">{t("common.whatsapp")}<br /><b dir="ltr" className="text-sm text-ink">{formatPhoneIntl(s.store.whatsapp.replace(/\D/g, ""))}</b></p>}
            {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
          </div>
        </div>
        <div className="px-3 pb-2.5 md:hidden">{searchForm("m")}</div>
      </div>

      <nav className="hidden bg-secondary/95 text-white md:block" aria-label="Main">
        <div className="mx-auto flex max-w-[84rem] items-stretch px-3">
          <details className="group relative">
            <summary className="flex h-11 cursor-pointer list-none items-center gap-2 bg-brand px-4 text-sm font-extrabold uppercase tracking-wide text-brand-ink [&::-webkit-details-marker]:hidden"><LayoutGrid className="size-4" />{t("shop.allCategories")}<ChevronDown className="size-4 transition group-open:rotate-180" /></summary>
            <ul className="absolute start-0 top-full z-50 w-64 border border-rule bg-surface py-1 text-ink shadow-lg">
              {categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className="block px-4 py-2 hover:bg-sunken">{tr(c.name, lang)}</Link></li>)}
              {categories.length === 0 && <li className="px-4 py-2 text-muted">—</li>}
            </ul>
          </details>
          <Link href="/shop" className="flex h-11 items-center px-4 text-sm font-bold uppercase hover:bg-white/10">{t("nav.shop")}</Link>
          {categories.slice(0, 6).map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="flex h-11 items-center px-4 text-sm font-semibold hover:bg-white/10">{tr(c.name, lang)}</Link>)}
        </div>
      </nav>
    </header>
  );
}
