import Link from "next/link";
import { Search, PackageSearch } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Editorial masthead: slim notice strip · centred wordmark between search and cart · category links under a double rule. */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  const tagline = tr(s.store.tagline, lang) || t("bk.tagline");
  return (
    <header className="relative z-40">
      <div className="border-b border-line">
        <div className="mx-auto flex h-9 max-w-[80rem] items-center justify-between gap-3 px-4">
          <p className="italic-serif min-w-0 truncate text-[0.82rem] text-muted">{ann || t("bk.tagline")}</p>
          <div className="flex shrink-0 items-center">
            <Link href="/track" className="btn btn-ghost btn-sm hidden !min-h-8 sm:inline-flex"><PackageSearch className="size-3.5" aria-hidden />{t("nav.track")}</Link>
            <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
            <ThemeToggle className="btn btn-ghost btn-sm !min-h-8" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[80rem] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-3 pt-4 sm:pt-6">
        <details className="group relative justify-self-start">
          <summary aria-label={t("nav.search")} className="btn btn-ghost btn-sm cursor-pointer list-none !px-2 [&::-webkit-details-marker]:hidden"><Search className="size-5" aria-hidden /><span className="hidden text-xs sm:inline">{t("common.search")}</span></summary>
          <form action="/shop" role="search" className="absolute start-0 top-full z-50 mt-2 flex w-[min(21rem,calc(100vw-2rem))] border border-ink bg-surface p-1.5 shadow-[4px_4px_0_var(--ink)]">
            <label className="sr-only" htmlFor="hdr-q">{t("nav.search")}</label>
            <input id="hdr-q" name="q" type="search" placeholder={t("bk.searchPh")} className="field min-w-0 flex-1 !border-0 !bg-transparent" enterKeyHint="search" />
            <button className="btn btn-primary btn-sm !shadow-none" aria-label={t("common.search")}><Search className="size-4" /></button>
          </form>
        </details>

        <Link href="/" aria-label={s.store.name} className="group flex flex-col items-center text-center">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="brand-logo h-10 w-auto max-w-56 object-contain sm:h-14" height={56} />
          ) : (
            <span dir="auto" className="display max-w-[11rem] text-[1.45rem] leading-[1.05] sm:max-w-none sm:text-5xl lg:text-[3.4rem]">{s.store.name}</span>
          )}
          <span className="eyebrow mt-1.5 hidden !text-[0.62rem] !text-muted sm:block">{tagline}</span>
        </Link>

        <div className="flex items-center gap-1 justify-self-end">
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm !px-2 sm:hidden"><PackageSearch className="size-5" /></Link>
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>

      <nav aria-label="Main" className="rule-double border-b border-line">
        <div className="mx-auto max-w-[80rem] px-4">
          <ul className="no-scrollbar flex items-center gap-x-6 overflow-x-auto overflow-y-hidden sm:justify-center sm:gap-x-9">
            <li><Link href="/shop" className="mast-link !text-brand">{t("bk.allBooks")}</Link></li>
            {categories.map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className="mast-link">{tr(c.name, lang)}</Link></li>)}
          </ul>
        </div>
      </nav>
    </header>
  );
}
