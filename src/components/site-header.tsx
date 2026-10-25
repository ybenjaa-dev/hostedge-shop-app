import Link from "next/link";
import { Search, Zap, PackageSearch } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { techIcon } from "@/lib/goal-icon";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Two decks: logo + wide search + utilities, then a category strip with icons. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop"), icon: <Zap className="size-4" /> }, ...categories.map((c) => { const I = techIcon(`${c.slug} ${tr(c.name, lang)}`); return { href: `/category/${c.slug}`, label: tr(c.name, lang), icon: <I className="size-4" /> }; }), { href: "/track", label: t("nav.track"), icon: <PackageSearch className="size-4" /> }];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-lg">
      {ann && <div className="bg-[#070b14] px-4 py-1.5 text-center text-xs font-semibold text-white/90">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:px-5">
        <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
        <Link href="/" className="heading flex shrink-0 items-center gap-2 text-lg sm:text-xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-8 w-auto max-w-40 object-contain" height={32} />
          ) : (
            <>
              <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-ink shadow-[0_0_18px_-2px_var(--brand)]"><Zap className="size-4.5" strokeWidth={2.5} /></span>
              <span dir="auto" className="max-w-[9rem] truncate sm:max-w-xs">{s.store.name}</span>
            </>
          )}
        </Link>
        <form action="/shop" role="search" className="mx-3 hidden max-w-xl flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">{t("nav.search")}</span>
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-full !rounded-xl ps-10" />
          </label>
        </form>
        <div className="ms-auto flex items-center gap-0.5">
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 md:hidden"><Search className="size-5" /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
      <nav aria-label="Main" className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-7xl items-center gap-1 px-5">
          {links.slice(0, -1).map((l, i) => (
            <li key={l.href}><Link href={l.href} className={`flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm hover:text-brand ${i === 0 ? "font-bold" : "font-medium text-muted"}`}><span className="text-brand">{l.icon}</span>{l.label}</Link></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
