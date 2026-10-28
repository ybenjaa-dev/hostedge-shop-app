import Link from "next/link";
import { Search, PackageSearch, Zap } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Always-black bar: slash mark + italic wordmark, caps nav with a lime underline, boxed search. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop") }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })), { href: "/track", label: t("nav.track") }];
  return (
    <header className="v14-bar sticky top-0 z-40 bg-[#0d0d0d] text-white">
      {ann && <div className="bg-[var(--lime)] px-4 py-1.5 text-center text-xs font-extrabold uppercase tracking-wide text-[#0d0d0d] sm:text-sm rtl:normal-case">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-2 px-2 sm:h-16 sm:gap-4 sm:px-5">
        <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
        <Link href="/" className="heading flex shrink-0 items-center gap-2 text-2xl sm:text-[1.7rem]" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="brand-logo h-8 w-auto max-w-40 object-contain brightness-0 invert sm:h-9" height={36} />
          ) : (<>
            <span className="grid size-8 -skew-x-12 place-items-center bg-[var(--lime)] text-[#0d0d0d]"><Zap className="size-5 skew-x-12" strokeWidth={2.6} /></span>
            <span dir="auto" className="block max-w-[7.5rem] truncate sm:max-w-xs">{s.store.name}</span>
          </>)}
        </Link>
        <nav aria-label="Main" className="ms-4 hidden items-center gap-1 lg:flex">
          {links.slice(0, -1).map((l, i) => <Link key={l.href} href={l.href} className={`heading !not-italic whitespace-nowrap px-3 py-1.5 text-[0.95rem] tracking-wide decoration-[var(--lime)] decoration-[3px] underline-offset-[10px] hover:underline ${i === 0 ? "text-[var(--lime)]" : "text-white/85"}`}>{l.label}</Link>)}
        </nav>
        <div className="ms-auto flex items-center gap-0.5 text-white sm:gap-1">
          <form action="/shop" role="search" className="hidden xl:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="h-10 w-48 border-2 border-white/25 bg-transparent ps-9 text-sm text-white outline-none placeholder:text-white/50 focus:border-[var(--lime)]" /></label></form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="grid size-10 place-items-center xl:hidden"><Search className="size-5" strokeWidth={2.2} /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="hidden size-10 place-items-center sm:grid"><PackageSearch className="size-5" strokeWidth={2.2} /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
