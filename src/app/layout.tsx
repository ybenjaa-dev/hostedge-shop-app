import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n";
import { allLangMetas, dirOf, isLang } from "@/lib/i18n-core";
import { getLangUi } from "@/lib/languages";
import { LangMetaProvider } from "@/components/lang-context";
import { googleFontsUrl } from "@/lib/fonts";
import { fileUrl } from "@/lib/storage";
import { onColor, readableOnWhite } from "@/lib/color";
import { ToastProvider } from "@/components/toast";
import { Analytics } from "@/components/analytics";
import { tr } from "@/lib/i18n-core";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const lang = await getLang();
  const fav = fileUrl(s.branding.favicon);
  // per-language URLs: canonical + hreflang for every enabled language (the Worker tells us which page this is)
  const h = await headers();
  const path = h.get("x-seo-path");
  let alternates: Metadata["alternates"];
  if (s.engage.langUrls && path && !/^\/(admin|api|setup|order|checkout|cart|track|offline|accept-invite)(\/|$)/.test(path)) {
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    const at = (l: string) => `${origin}/${l}${path === "/" ? "" : path}`;
    alternates = { canonical: at(lang), languages: { ...Object.fromEntries(s.store.langs.map((l) => [l, at(l)])), "x-default": at(s.store.defaultLang) } };
  }
  return {
    alternates,
    manifest: s.engage.pwa ? "/manifest.webmanifest" : undefined,
    appleWebApp: s.engage.pwa ? { capable: true, title: s.store.name, statusBarStyle: "default" } : undefined,
    other: { "mobile-web-app-capable": "yes" },
    title: { default: s.store.name, template: `%s · ${s.store.name}` },
    description: tr(s.store.tagline, lang) || s.store.name,
    icons: fav ? { icon: fav } : undefined,
    openGraph: { siteName: s.store.name, type: "website" },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbfaf7" };

/** Applies the saved theme before first paint. The owner can force a default, and hide the toggle (then visitors' old choice is ignored on the storefront). */
const themeInit = (mode: string, locked: boolean) => `try{var m='${mode}',t=${locked} && location.pathname.indexOf('/admin')!==0?null:localStorage.getItem('theme');if(t==='dark'||(!t&&(m==='dark'||(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))))document.documentElement.dataset.theme='dark'}catch(e){}`;
/** Google Fonts load without blocking the first paint (the page shows in a system font, then swaps). */
const FONT_SWAP = `document.querySelectorAll('link[data-swap]').forEach(function(l){function s(){l.media='all'}l.sheet?s():l.addEventListener('load',s)})`;
const HIDE_CSS = `html[data-hide-lang] [data-lang-switcher],html[data-hide-theme] [data-theme-toggle]:not([data-admin]){display:none!important}@media (max-width:767px){html[data-hide-lang-m] [data-lang-switcher],html[data-hide-theme-m] [data-theme-toggle]:not([data-admin]){display:none!important}}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const lang = await getLang();
  const ui = await getLangUi();
  const prefix = (await headers()).get("x-seo-lang");
  if (prefix && !isLang(prefix)) notFound(); // /zz/… for a language the store doesn't have
  const rtl = dirOf(lang) === "rtl";
  const b = s.branding;
  const brand = readableOnWhite(b.primary); // darkened just enough for 4.5:1 text contrast in light mode
  const radius = b.buttonStyle === "pill" ? "9999px" : b.buttonStyle === "square" ? "0.25rem" : "0.75rem";
  const css = `:root:root{--brand:${brand};--brand-ink:${onColor(brand)};--secondary:${b.secondary};--accent:${b.accent};--accent-ink:${onColor(b.accent)};--btn-radius:${radius};--font-body:'${b.fontLatin}';--font-body-ar:'${b.fontArabic}';--font-display:'${rtl ? b.fontArabic : b.fontLatin}';--font-heading:'${rtl ? b.fontArabic : b.fontLatin}'}${brand !== b.primary ? `:root:root[data-theme="dark"]{--brand:${b.primary};--brand-ink:${onColor(b.primary)}}` : ""}`;
  return (
    <html lang={lang} dir={dirOf(lang)} suppressHydrationWarning
      data-hide-lang={!ui.langSwitcher.show ? "" : undefined} data-hide-lang-m={!ui.langSwitcher.mobile ? "" : undefined}
      data-hide-theme={!ui.themeToggle.show ? "" : undefined} data-hide-theme-m={!ui.themeToggle.mobile ? "" : undefined}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={googleFontsUrl(b.fontLatin, b.fontArabic)} media="print" data-swap="" suppressHydrationWarning />
        <noscript><link rel="stylesheet" href={googleFontsUrl(b.fontLatin, b.fontArabic)} /></noscript>
        <script dangerouslySetInnerHTML={{ __html: FONT_SWAP }} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <style dangerouslySetInnerHTML={{ __html: HIDE_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: themeInit(ui.themeToggle.default, !ui.themeToggle.show) }} />
      </head>
      <body className="min-h-dvh antialiased">
        <LangMetaProvider metas={allLangMetas().filter((m) => !m.custom || s.store.langs.includes(m.code))} ui={{ style: ui.langSwitcher.style }}><ToastProvider>{children}</ToastProvider></LangMetaProvider>
        <Analytics a={s.analytics} />
      </body>
    </html>
  );
}
