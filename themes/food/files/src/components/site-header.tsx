import Link from "next/link";
import { Search, PackageSearch, Leaf } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { MobileMenu } from "./mobile-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Solid cream header with a heavy underline: leaf mark + wordmark, boxed search, outlined category pills. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const links = [{ href: "/shop", label: t("nav.shop") }, ...categories.map((c) => ({ href: `/category/${c.slug}`, label: tr(c.name, lang) })), { href: "/track", label: t("nav.track") }];
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-bg">
      {ann && <div className="border-b-2 border-ink bg-[var(--mustard)] px-4 py-1.5 text-center text-xs font-extrabold text-[#1f2a1c] sm:text-sm">{s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}</div>}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-5">
        <MobileMenu links={links} title={t("nav.menu")} closeLabel={t("cod.close")} openLabel={t("nav.menu")} />
        <Link href="/" className="heading flex shrink-0 items-center gap-2 text-2xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="brand-logo h-9 w-auto max-w-44 object-contain" height={36} />
          ) : (<>
            <span className="grid size-9 place-items-center rounded-full border-2 border-ink bg-brand text-brand-ink shadow-[2px_2px_0_var(--ink)]"><Leaf className="size-4.5" strokeWidth={2.5} /></span>
            <span dir="auto" className="block max-w-[8.5rem] truncate sm:max-w-xs">{s.store.name}</span>
          </>)}
        </Link>
        <nav aria-label="Main" className="ms-3 hidden items-center gap-1.5 lg:flex">
          {links.slice(0, -1).map((l, i) => <Link key={l.href} href={l.href} className={`whitespace-nowrap rounded-full border-2 px-3.5 py-1 text-sm font-extrabold transition hover:bg-[var(--mustard)] hover:text-[#1f2a1c] ${i === 0 ? "border-ink bg-ink text-bg hover:!border-ink" : "border-transparent hover:border-ink"}`}>{l.label}</Link>)}
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <form action="/shop" role="search" className="hidden xl:block"><label className="relative block"><span className="sr-only">{t("nav.search")}</span><Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden /><input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-44 !rounded-full ps-9" /></label></form>
          <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm !px-2 xl:hidden"><Search className="size-5" strokeWidth={2.5} /></Link>
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex"><PackageSearch className="size-5" strokeWidth={2.5} /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm hidden !px-2 sm:inline-flex" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
