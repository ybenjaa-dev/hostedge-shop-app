import Link from "next/link";
import { Search, PackageSearch, Baby, Package } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { kidIcon } from "@/lib/goal-icon";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

const DOT = ["bg-[var(--brand)]", "bg-[var(--mint)]", "bg-[var(--lilac)]", "bg-[var(--sunny)]", "bg-[var(--sky)]"];

/** A floating pill bar: wordmark with a baby mark, category pills with coloured dots, search, utilities. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const rooms = categories.map((c) => { const I = kidIcon(`${c.slug} ${tr(c.name, lang)}`); return { href: `/category/${c.slug}`, label: tr(c.name, lang), icon: <I className="size-5" /> }; });
  const links = [{ href: "/shop", label: t("nav.shop"), icon: <Baby className="size-5" /> }, ...rooms, { href: "/track", label: t("nav.track"), icon: <Package className="size-5" /> }];
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3">
      {ann && <div className="mx-auto mb-2 max-w-7xl rounded-full bg-[var(--sunken)] px-4 py-1.5 text-center text-xs font-bold sm:text-sm">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="soft mx-auto flex h-14 max-w-7xl items-center gap-1 rounded-full bg-surface/95 px-2 backdrop-blur sm:h-16 sm:gap-3 sm:px-4">
        <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
        <Link href="/" className="heading flex shrink-0 items-center gap-2 text-xl sm:text-2xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-8 w-auto max-w-40 object-contain sm:h-9" height={36} />
          ) : (<>
            <span className="grid size-9 place-items-center rounded-full bg-[var(--sunny)] text-[#1e2a4a]"><Baby className="size-5" /></span>
            <span dir="auto" className="block max-w-[6.5rem] truncate sm:max-w-xs">{s.store.name}</span>
          </>)}
        </Link>
        <nav aria-label="Main" className="ms-2 hidden items-center gap-0.5 lg:flex">
          {links.slice(0, -1).map((l, i) => <Link key={l.href} href={l.href} className="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold hover:bg-sunken"><span className={`size-2.5 rounded-full ${i === 0 ? "bg-ink" : DOT[(i - 1) % DOT.length]}`} />{l.label}</Link>)}
        </nav>
        <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
          <form action="/shop" role="search" className="hidden xl:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-44 !rounded-full ps-9" /></label></form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 xl:hidden"><Search className="size-5" /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
