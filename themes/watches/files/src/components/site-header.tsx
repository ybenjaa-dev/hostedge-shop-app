import Link from "next/link";
import { Search, PackageSearch } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Maison header: hairline announcement · nav left / wordmark centre / tools right. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const logoEl = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={s.store.name} className="brand-logo h-7 w-auto max-w-44 object-contain md:h-9" height={36} />
  ) : (
    <span dir="auto" className="display block whitespace-nowrap text-[0.98rem] uppercase tracking-[0.22em] text-ink sm:text-[1.55rem] sm:tracking-[0.38em] rtl:tracking-normal">{s.store.name}</span>
  );
  const navLink = "caps lx-link hidden lg:inline-block";
  return (
    <>
      {ann && <p className="caps border-b border-line px-4 py-2 text-center text-[0.62rem] text-muted">{ann}</p>}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto grid h-[var(--hdr)] max-w-[100rem] grid-cols-[1fr_auto_1fr] items-center gap-1 px-3 md:gap-3 md:px-8">
          <div className="flex items-center gap-7">
            <details className="lx-menu lg:hidden">
              <summary aria-label={t("nav.menu")} className="grid size-10 cursor-pointer place-items-center">
                <span className="lx-bars grid gap-[7px]" aria-hidden><span /><span /></span>
              </summary>
              <nav className="lx-pop absolute inset-x-0 top-full h-[calc(100dvh-var(--hdr))] overflow-y-auto border-t border-line bg-bg px-6 pb-24 pt-8" aria-label={t("nav.menu")}>
                <p className="eyebrow mb-4">{t("lux.collections")}</p>
                <ul className="divide-y divide-[var(--line)] border-y border-line">
                  <li><Link href="/shop" className="display flex items-center justify-between py-4 text-3xl">{t("nav.shop")}<span className="lx-num text-sm text-muted">—</span></Link></li>
                  {categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className="display flex items-center justify-between py-4 text-3xl">{tr(c.name, lang)}</Link></li>)}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link href="/track" className="caps lx-link">{t("nav.track")}</Link>
                  <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
                  <ThemeToggle className="btn btn-ghost btn-sm" />
                </div>
              </nav>
            </details>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
              <Link href="/shop" className={navLink}>{t("nav.shop")}</Link>
              {categories.slice(0, 3).map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className={navLink}>{tr(c.name, lang)}</Link>)}
            </nav>
          </div>

          <Link href="/" aria-label={s.store.name} className="justify-self-center">{logoEl}</Link>

          <div className="flex items-center justify-end gap-0.5 md:gap-1">
            <details className="lx-menu">
              <summary aria-label={t("nav.search")} className="btn btn-ghost btn-sm cursor-pointer !px-2"><Search className="size-[1.15rem]" strokeWidth={1.4} aria-hidden /></summary>
              <form action="/shop" role="search" className="lx-pop absolute inset-x-0 top-full border-b border-line bg-bg px-6 py-8 md:px-16">
                <label className="eyebrow" htmlFor="hdr-q">{t("nav.search")}</label>
                <div className="mx-auto mt-2 flex max-w-3xl items-end gap-4">
                  <input id="hdr-q" name="q" type="search" placeholder={t("shop.searchPh")} className="field display !text-3xl md:!text-5xl" enterKeyHint="search" />
                  <button className="btn btn-outline shrink-0" aria-label={t("common.search")}><Search className="size-4" strokeWidth={1.4} aria-hidden /></button>
                </div>
              </form>
            </details>
            <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 lg:inline-flex"><PackageSearch className="size-[1.15rem]" strokeWidth={1.4} aria-hidden /></Link>
            <span className="hidden items-center lg:flex"><LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} /><ThemeToggle className="btn btn-ghost btn-sm" /></span>
            {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
          </div>
        </div>
      </header>
    </>
  );
}
