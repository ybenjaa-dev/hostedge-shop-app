import Link from "next/link";
import { Search, Menu, PackageSearch, ChevronDown, X, ArrowUpRight } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NavMenu } from "./nav-menu";
import { CartButton } from "@/features/checkout/components/cart-button";

type Cat = { slug: string; name: string; image?: string | null; count?: number };

/** Compact sticky mega-nav: lime ticker · slanted logo · category mega-panel · search pop · slide-in mobile menu. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: Cat[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = (s.announcement.enabled ? tr(s.announcement.text, lang) : "") || t("sp.ticker");
  const logoEl = logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt={s.store.name} className="brand-logo h-9 w-auto max-w-44 object-contain" height={36} />
  ) : (
    <span className="lime skew block px-3 py-1"><span dir="auto" className="display block text-xl sm:text-2xl">{s.store.name}</span></span>
  );
  const tile = (c: Cat) => (
    <Link key={c.slug} href={`/category/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-sunken">
      {c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(c.image, "md")} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-110" />}
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white">
        <span className="display text-xl leading-none">{tr(c.name, lang)}</span>
        <ArrowUpRight className="size-5 shrink-0 text-[var(--brand)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100" aria-hidden />
      </span>
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="lime overflow-hidden whitespace-nowrap py-1 text-[0.72rem] font-black uppercase tracking-[0.2em]" aria-label={ann}>
        <div className="marquee" aria-hidden>
          {[0, 1].map((k) => <div key={k} className="flex shrink-0">{Array.from({ length: 6 }).map((_, i) => <span key={i} className="px-6">{ann} <span className="px-6 opacity-60">/</span></span>)}</div>)}
        </div>
      </div>
      <div className="mx-auto flex h-14 max-w-[90rem] items-stretch gap-2 px-3 sm:px-5 md:h-[4.25rem]">
        <NavMenu
          label={t("nav.menu")} className="flex items-center lg:hidden" summaryClass="btn btn-ghost btn-sm cursor-pointer list-none !px-2" summary={<Menu className="size-6" aria-hidden />}
          panelClass="fixed inset-0 z-[60] bg-black/70 backdrop-blur-[2px]"
        >
          <nav className="slide-in flex h-full w-[88vw] max-w-sm flex-col overflow-y-auto bg-bg p-5" aria-label={t("nav.menu")}>
            <div className="mb-6 flex items-center justify-between">{logoEl}<button type="button" data-close aria-label={t("cod.close")} className="btn btn-ghost btn-sm !px-2"><X className="size-6" /></button></div>
            <Link href="/shop" className="display border-b border-line py-3 text-4xl">{t("sp.all")}</Link>
            {categories.map((c, i) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="group flex items-baseline gap-3 border-b border-line py-3">
                <span className="num text-xs font-black text-[var(--brand)]">{String(i + 1).padStart(2, "0")}</span>
                <span className="display text-3xl transition group-hover:text-[var(--brand)]">{tr(c.name, lang)}</span>
              </Link>
            ))}
            <div className="mt-5 flex items-center justify-between gap-3"><Link href="/track" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted"><PackageSearch className="size-4" />{t("nav.track")}</Link><LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} /></div>
          </nav>
        </NavMenu>

        <Link href="/" aria-label={s.store.name} className="flex shrink-0 items-center px-1 lg:me-4">{logoEl}</Link>

        <nav className="hidden flex-1 items-stretch lg:flex" aria-label="Main">
          <Link href="/shop" className="nav-link">{t("nav.shop")}</Link>
          {categories.length > 0 && (
            <NavMenu
              label={t("shop.category")} className="flex" summaryClass="nav-link gap-1" summary={<>{t("shop.category")}<ChevronDown className="size-4" aria-hidden /></>}
              panelClass="absolute inset-x-0 top-full border-y border-line bg-surface shadow-[0_30px_40px_-20px_rgba(0,0,0,.6)]"
            >
              <div className="mx-auto grid max-w-[90rem] animate-fade grid-cols-3 gap-3 p-5 xl:grid-cols-4">{categories.map(tile)}</div>
            </NavMenu>
          )}
          {categories.slice(0, 3).map((c, i) => <Link key={c.slug} href={`/category/`} className={`nav-link `}>{tr(c.name, lang)}</Link>)}
          <Link href="/track" className="nav-link">{t("nav.track")}</Link>
        </nav>

        <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
          <NavMenu
            label={t("nav.search")} className="flex items-center" summaryClass="btn btn-ghost btn-sm cursor-pointer list-none !px-2" summary={<Search className="size-5" aria-hidden />}
            panelClass="absolute inset-x-0 top-full border-y border-line bg-surface p-4 shadow-[0_30px_40px_-20px_rgba(0,0,0,.6)]"
          >
            <form action="/shop" role="search" className="mx-auto flex max-w-3xl animate-fade gap-2">
              <label className="sr-only" htmlFor="sp-q">{t("nav.search")}</label>
              <input id="sp-q" name="q" type="search" placeholder={t("sp.search")} className="field display !text-2xl min-w-0 flex-1" enterKeyHint="search" />
              <button className="btn btn-primary" aria-label={t("common.search")}><Search className="size-5" /></button>
            </form>
          </NavMenu>
          <div className="hidden lg:block"><LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} /></div>
          <ThemeToggle className="btn btn-ghost btn-sm !px-2" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
    </header>
  );
}
