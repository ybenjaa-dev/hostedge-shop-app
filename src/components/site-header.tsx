import Link from "next/link";
import { Menu, Search, X, ArrowUpRight } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Scrolling ticker made of the announcement text, repeated so the loop is seamless. */
function Ticker({ text, href }: { text: string; href: string }) {
  const item = (k: number) => (
    <span key={k} className="flex shrink-0 items-center gap-6 px-3 text-xs font-extrabold uppercase tracking-widest sm:text-[0.8rem]">
      {text} <span aria-hidden className="text-accent">✦</span>
    </span>
  );
  const row = Array.from({ length: 8 }, (_, i) => item(i));
  const inner = (
    <div className="marquee overflow-hidden" aria-label={text} role="marquee">
      <div className="marquee-track" aria-hidden>{row}{row}</div>
    </div>
  );
  return <div className="bg-[#111] py-2 text-white">{href ? <Link href={href}>{inner}</Link> : inner}</div>;
}

export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const ann = s.announcement;
  const logo = fileUrl(s.branding.logo);
  return (
    <header className="sticky top-0 z-40 bg-bg">
      {ann.enabled && tr(ann.text, lang) && <Ticker text={tr(ann.text, lang)} href={ann.href} />}
      <div className="border-b-2 border-ink">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16">
          <Link href="/" className="display flex items-center gap-2 text-[1.35rem] font-extrabold uppercase sm:text-2xl" aria-label={s.store.name}>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={s.store.name} className="h-8 w-auto max-w-40 object-contain sm:h-9" height={36} />
            ) : (
              <>
                <span aria-hidden className="grid size-8 place-items-center border-2 border-ink bg-brand text-sm text-brand-ink shadow-[2px_2px_0_var(--ink)]">{s.store.name.slice(0, 1)}</span>
                <span dir="auto" className="max-w-[7.5rem] truncate sm:max-w-none">{s.store.name}</span>
              </>
            )}
          </Link>

          <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            <Link href="/shop" className="px-3 py-2 text-sm font-extrabold uppercase tracking-wide hover:bg-ink hover:text-bg">{t("nav.shop")}</Link>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap px-3 py-2 text-sm font-bold uppercase tracking-wide text-muted hover:bg-ink hover:text-bg">{tr(c.name, lang)}</Link>
            ))}
            <Link href="/track" className="px-3 py-2 text-sm font-bold uppercase tracking-wide text-muted hover:bg-ink hover:text-bg">{t("nav.track")}</Link>
          </nav>

          <div className="ms-auto flex items-center gap-0.5 sm:gap-1.5">
            <form action="/shop" role="search" className="hidden xl:block">
              <label className="relative block">
                <span className="sr-only">{t("nav.search")}</span>
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <input name="q" type="search" placeholder={t("shop.searchPh")} className="field !min-h-10 w-56 !py-1.5 ps-9" />
              </label>
            </form>
            <Link href="/shop#m-search" aria-label={t("nav.search")} className="btn btn-ghost btn-sm xl:hidden"><Search className="size-5" /></Link>
            <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
            <ThemeToggle className="btn btn-ghost btn-sm hidden sm:inline-flex" />
            {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
            {/* full-screen menu — pure <details>, no JS */}
            <details className="group lg:hidden">
              <summary aria-label={t("nav.menu")} className="btn btn-primary btn-sm list-none !px-2.5 [&::-webkit-details-marker]:hidden">
                <Menu className="size-5 group-open:hidden" /><X className="hidden size-5 group-open:block" />
              </summary>
              <nav className="fixed inset-x-0 bottom-0 top-[6.25rem] z-50 overflow-y-auto bg-brand p-5 text-brand-ink" aria-label="Menu">
                <ul className="display space-y-1 text-4xl font-extrabold uppercase">
                  <li><Link href="/shop" className="flex items-center justify-between border-b-2 border-current py-3">{t("nav.shop")} <ArrowUpRight className="size-8" /></Link></li>
                  {categories.map((c) => (<li key={c.slug}><Link href={`/category/${c.slug}`} className="flex items-center justify-between border-b-2 border-current py-3 text-2xl">{tr(c.name, lang)} <ArrowUpRight className="size-6" /></Link></li>))}
                  <li><Link href="/track" className="flex items-center justify-between border-b-2 border-current py-3 text-2xl">{t("nav.track")} <ArrowUpRight className="size-6" /></Link></li>
                  <li className="pt-3 sm:hidden"><ThemeToggle className="btn btn-outline !bg-white !text-[#111]" /></li>
                </ul>
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}
