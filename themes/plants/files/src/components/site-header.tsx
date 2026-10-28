import Link from "next/link";
import { Search, Phone, PackageSearch, Home, Flower2, Menu, Sprout } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { formatPhoneIntl } from "@/lib/phone";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NavLink } from "./nav-link";
import { LeafMark } from "./botanical";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Floating rounded pill nav on desktop, slim top bar + bottom-docked pill navigation on mobile. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const phone = s.store.phones.filter(Boolean)[0];
  const logoEl = (
    <span className="flex items-center gap-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={s.store.name} className="brand-logo h-9 w-auto max-w-40 object-contain" height={36} />
      ) : (
        <>
          <LeafMark className="size-9 shrink-0 transition-transform group-hover/logo:rotate-12" />
          <span dir="auto" className="display text-[1.35rem] font-semibold leading-none text-ink">{s.store.name}</span>
        </>
      )}
    </span>
  );
  const iconBtn = "btn btn-ghost btn-sm !min-h-10 !px-2.5";
  const cart = !s.checkout.codMode && <CartButton label={t("nav.cart")} />;
  return (
    <header>
      {ann && (
        <div className="px-3 pt-2.5 text-center">
          <p className="sticker !rotate-0 max-w-full truncate !text-[0.75rem] sm:!text-[0.8rem]"><Sprout className="size-3.5 shrink-0" aria-hidden />{ann}</p>
        </div>
      )}

      {/* desktop: floating pill */}
      <div className="sticky top-3 z-40 hidden px-4 pt-3 md:block">
        <div className="nb-pill mx-auto flex max-w-[78rem] items-center gap-2 py-2 ps-3 pe-2 backdrop-blur">
          <Link href="/" aria-label={s.store.name} className="group/logo me-2 shrink-0 rounded-full">{logoEl}</Link>
          <nav aria-label="Main" className="flex min-w-0 items-center gap-1 overflow-x-auto no-scrollbar">
            <NavLink href="/shop" match="/shop" className="nav-link">{t("nav.shop")}</NavLink>
            {categories.slice(0, 3).map((c) => <NavLink key={c.slug} href={`/category/${c.slug}`} className="nav-link">{tr(c.name, lang)}</NavLink>)}
          </nav>
          <form action="/shop" role="search" className="relative ms-auto hidden lg:block">
            <label className="sr-only" htmlFor="hd-q">{t("nav.search")}</label>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input id="hd-q" name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 !w-44 !rounded-full !ps-9 transition-[width] focus:!w-60" enterKeyHint="search" />
          </form>
          <div className="ms-auto flex shrink-0 items-center gap-0.5 lg:ms-0">
            <Link href="/shop" aria-label={t("common.search")} className={`${iconBtn} lg:hidden`}><Search className="size-5" /></Link>
            {phone && <a href={`tel:+${phone.replace(/\D/g, "")}`} dir="ltr" aria-label={t("common.call")} className={`${iconBtn} hidden xl:inline-flex`}><Phone className="size-4" />{formatPhoneIntl(phone.replace(/\D/g, ""))}</a>}
            <Link href="/track" aria-label={t("nav.track")} title={t("nav.track")} className={iconBtn}><PackageSearch className="size-5" /></Link>
            <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
            <ThemeToggle className={iconBtn} />
            {cart}
          </div>
        </div>
      </div>

      {/* mobile: slim top bar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 md:hidden">
        <Link href="/" aria-label={s.store.name} className="group/logo rounded-full">{logoEl}</Link>
        <div className="nb-pill flex items-center px-1 py-0.5">
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className={iconBtn} />
        </div>
      </div>

      {/* mobile: bottom-docked floating pill */}
      <nav aria-label="Dock" className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-sm md:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="nb-pill relative flex items-center justify-around bg-surface/95 p-1.5 backdrop-blur">
          <NavLink href="/" className="dock-item"><Home className="size-5" aria-hidden />{t("nav.home")}</NavLink>
          <NavLink href="/shop" match="/shop" className="dock-item"><Flower2 className="size-5" aria-hidden />{t("nav.shop")}</NavLink>
          {cart ? <div className="dock-item !p-0 [&_button]:!shadow-none">{cart}<span>{t("nav.cart")}</span></div> : <NavLink href="/track" className="dock-item"><PackageSearch className="size-5" aria-hidden />{t("nav.track").split(" ")[0]}</NavLink>}
          <details className="group">
            <summary aria-label={t("nav.menu")} className="dock-item cursor-pointer"><Menu className="size-5" aria-hidden />{t("nav.menu")}</summary>
            <div className="nb absolute inset-x-0 bottom-full mb-3 max-h-[70dvh] overflow-y-auto p-4">
              <form action="/shop" role="search" className="relative">
                <label className="sr-only" htmlFor="dk-q">{t("nav.search")}</label>
                <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input id="dk-q" name="q" type="search" placeholder={t("shop.searchPh")} className="field !rounded-full !ps-10" enterKeyHint="search" />
              </form>
              <p className="display mb-2 mt-4 text-sm text-muted">{t("shop.category")}</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="chip">{tr(c.name, lang)}</Link>)}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-line pt-4">
                {cart && <Link href="/track" className="chip"><PackageSearch className="size-4" />{t("nav.track")}</Link>}
                {!cart && <Link href="/shop" className="chip"><Flower2 className="size-4" />{t("shop.allCategories")}</Link>}
                {phone && <a href={`tel:+${phone.replace(/\D/g, "")}`} dir="ltr" className="chip"><Phone className="size-4" />{formatPhoneIntl(phone.replace(/\D/g, ""))}</a>}
              </div>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
