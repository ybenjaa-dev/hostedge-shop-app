import Link from "next/link";
import { Search, PackageSearch, Gauge, Package, Wrench } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { autoIcon } from "@/lib/goal-icon";
import { LangSwitcher } from "./lang-switcher";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Carbon bar with a hazard stripe: gauge mark + wordmark, wide search, category links with icons. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop"), icon: <Wrench className="size-4" /> }, ...categories.map((c) => { const I = autoIcon(`${c.slug} ${tr(c.name, lang)}`); return { href: `/category/${c.slug}`, label: tr(c.name, lang), icon: <I className="size-4" /> }; }), { href: "/track", label: t("nav.track"), icon: <Package className="size-4" /> }];
  return (
    <header className="v15-bar sticky top-0 z-40 text-white">
      <div className="carbon">
        {ann && <div className="bg-[var(--brand)] px-4 py-1 text-center text-xs font-bold text-white sm:text-sm">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
        <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-2 px-2 sm:h-16 sm:gap-4 sm:px-5">
          <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
          <Link href="/" className="heading flex shrink-0 items-center gap-2 text-xl sm:text-2xl" aria-label={s.store.name}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={s.store.name} className="brand-logo h-8 w-auto max-w-40 object-contain brightness-0 invert sm:h-9" height={36} />
            ) : (<>
              <span className="grid size-9 place-items-center rounded-lg bg-[var(--brand)] text-white"><Gauge className="size-5" /></span>
              <span dir="auto" className="block max-w-[7.5rem] truncate sm:max-w-xs">{s.store.name}</span>
            </>)}
          </Link>
          <form action="/shop" role="search" className="mx-2 hidden max-w-xl flex-1 md:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="h-10 w-full rounded-lg border border-white/20 bg-white/10 ps-10 text-sm text-white outline-none placeholder:text-white/55 focus:border-[var(--brand)]" /></label></form>
          <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
            <Link href="/shop#m-search" aria-label={t("nav.search")} className="grid size-10 place-items-center md:hidden"><Search className="size-5" /></Link>
            <Link href="/track" aria-label={t("nav.track")} className="hidden size-10 place-items-center sm:grid"><PackageSearch className="size-5" /></Link>
            <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
            {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
          </div>
        </div>
        <nav aria-label="Main" className="relative hidden border-t border-white/10 lg:block">
          <ul className="mx-auto flex max-w-7xl items-center gap-1 px-5">
            {links.slice(0, -1).map((l, i) => <li key={l.href}><Link href={l.href} className={`flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm hover:text-white ${i === 0 ? "font-bold text-white" : "font-medium text-white/70"}`}><span className="text-[var(--brand)]">{l.icon}</span>{l.label}</Link></li>)}
          </ul>
        </nav>
      </div>
      <div className="stripe" />
    </header>
  );
}
