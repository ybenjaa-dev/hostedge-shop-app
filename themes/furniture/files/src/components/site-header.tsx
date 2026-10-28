import Link from "next/link";
import { Search, Phone, PackageSearch } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { formatPhoneIntl } from "@/lib/phone";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { CartButton } from "@/features/checkout/components/cart-button";

type Cat = { slug: string; name: string; count?: number };

/** Showroom navigation: a fixed left rail on desktop (logo · collections · search · cart · language), a slim top bar + drawer below 1024px. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: Cat[] }) {
  const logo = fileUrl(s.branding.logo);
  const phone = s.store.phones.filter(Boolean)[0];
  const wordmark = (size: string) => logo
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={logo} alt={s.store.name} className="brand-logo h-9 w-auto max-w-44 object-contain" height={36} />
    : <span dir="auto" className={`display block ${size}`}>{s.store.name}</span>;

  const body = (idp: string) => (
    <>
      <nav className="nh-nav" aria-label={t("nav.collections")}>
        <p className="micro mb-3">{t("nav.collections")}</p>
        <Link href="/shop">{t("nav.shop")}</Link>
        {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`}>{tr(c.name, lang)}{c.count != null && <span className="n">{c.count}</span>}</Link>)}
      </nav>
      <form action="/shop" role="search" className="mt-8 flex items-center gap-2 border-b border-rule focus-within:border-brand">
        <label className="sr-only" htmlFor={`${idp}-q`}>{t("nav.search")}</label>
        <input id={`${idp}-q`} name="q" type="search" placeholder={t("shop.searchPh")} enterKeyHint="search" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted" />
        <button aria-label={t("common.search")} className="text-muted hover:text-ink"><Search className="size-4" strokeWidth={1.5} /></button>
      </form>
      <div className="mt-auto space-y-1 pt-10 text-sm">
        {!s.checkout.codMode && <CartButton label={t("nav.cart")} showLabel className="btn btn-ghost btn-sm relative w-full !justify-start !px-0 !normal-case !tracking-normal !text-[0.95rem] hover:!bg-transparent" />}
        <Link href="/track" className="flex items-center gap-2 py-2 text-muted hover:text-ink"><PackageSearch className="size-[1.15rem]" strokeWidth={1.5} />{t("nav.track")}</Link>
        {phone && <a href={`tel:+${phone.replace(/\D/g, "")}`} dir="ltr" className="flex items-center gap-2 py-2 text-muted hover:text-ink rtl:flex-row-reverse rtl:justify-end"><Phone className="size-[1.15rem]" strokeWidth={1.5} />{formatPhoneIntl(phone.replace(/\D/g, ""))}</a>}
        <div className="-ms-2 flex items-center gap-1 pt-3"><LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} up /><ThemeToggle /></div>
      </div>
    </>
  );

  return (
    <>
      <aside className="nh-side" aria-label="Main">
        <Link href="/" aria-label={s.store.name} className="block text-[2rem]">{wordmark("text-[2.15rem]")}</Link>
        <p className="micro mt-3">{t("home.kicker")}</p>
        <div className="mt-12 flex flex-1 flex-col">{body("d")}</div>
      </aside>

      <div className="nh-topbar sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto grid h-14 max-w-3xl grid-cols-[1fr_auto_1fr] items-center px-4">
          <div><MobileNav label={t("nav.menu")} closeLabel={t("cod.close")}>
            <Link href="/" className="mb-1 block">{wordmark("text-3xl")}</Link>
            <p className="micro mb-10">{t("home.kicker")}</p>
            <div className="flex flex-1 flex-col">{body("m")}</div>
          </MobileNav></div>
          <Link href="/" aria-label={s.store.name} className="max-w-[55vw] truncate">{wordmark("text-[1.55rem]")}</Link>
          <div className="flex items-center justify-end gap-1">
            {!s.checkout.codMode ? <CartButton label={t("nav.cart")} className="btn btn-ghost btn-sm relative !px-2" /> : <Link href="/shop" aria-label={t("common.search")} className="btn btn-ghost btn-sm !px-2"><Search className="size-5" strokeWidth={1.5} /></Link>}
          </div>
        </div>
      </div>
    </>
  );
}
