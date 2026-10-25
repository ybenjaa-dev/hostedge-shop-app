import Link from "next/link";
import { Search, PackageSearch, Pill } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { fileUrl } from "@/lib/storage";
import { goalIcon } from "@/lib/goal-icon";
import { LangSwitcher } from "./lang-switcher";
import { ThemeToggle } from "./theme-toggle";
import { CartButton } from "@/features/checkout/components/cart-button";

/** Dark message strip · logo + wide search + utilities · scrollable "goal" chips (replaces a hamburger menu). */
export function SiteHeader({ s, lang, t, categories }: { s: Settings; lang: Lang; t: TFn; categories: { slug: string; name: string }[] }) {
  const logo = fileUrl(s.branding.logo);
  const ann = s.announcement.enabled ? tr(s.announcement.text, lang) : "";
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      {ann && (
        <div className="bg-secondary px-4 py-1.5 text-center text-xs font-bold tracking-wide text-accent sm:text-[0.8rem]">
          {s.announcement.href ? <Link href={s.announcement.href} className="hover:underline">{ann}</Link> : ann}
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-5">
        <Link href="/" className="display flex shrink-0 items-center gap-2 text-[1.45rem] font-extrabold sm:text-2xl" aria-label={s.store.name}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="brand-logo h-9 w-auto max-w-40 object-contain sm:h-10" height={40} />
          ) : (
            <>
              <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-secondary text-accent"><Pill className="size-5 -rotate-45" strokeWidth={2.4} /></span>
              <span dir="auto" className="max-w-[9rem] truncate sm:max-w-[16rem]">{s.store.name}</span>
            </>
          )}
        </Link>
        <form action="/shop" role="search" className="order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-xl md:mx-auto">
          <label className="relative block">
            <span className="sr-only">{t("nav.search")}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input name="q" type="search" placeholder={t("shop.searchPh")} enterKeyHint="search" className="field !rounded-full !bg-sunken !border-transparent ps-12" />
          </label>
        </form>
        <div className="ms-auto flex items-center gap-0.5 sm:ms-0">
          <Link href="/track" aria-label={t("nav.track")} className="btn btn-ghost btn-sm !px-2"><PackageSearch className="size-5" /></Link>
          <LangSwitcher current={lang} langs={s.store.langs} label={t("nav.language")} />
          <ThemeToggle className="btn btn-ghost btn-sm !px-2" />
          {!s.checkout.codMode && <CartButton label={t("nav.cart")} />}
        </div>
      </div>
      {categories.length > 0 && (
        <nav aria-label={t("goal.title")} className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 pb-2.5 [scrollbar-width:none] sm:px-5">
          <Link href="/shop" className="chip chip-on">{t("nav.shop")}</Link>
          {categories.map((c) => {
            const Icon = goalIcon(`${c.slug} ${tr(c.name, "en")} ${tr(c.name, lang)}`);
            return <Link key={c.slug} href={`/category/${c.slug}`} className="chip"><Icon className="size-4 text-brand" aria-hidden />{tr(c.name, lang)}</Link>;
          })}
        </nav>
      )}
    </header>
  );
}
