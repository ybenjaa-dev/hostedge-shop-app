import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { getLang } from "@/lib/i18n";
import { dirOf } from "@/lib/i18n-core";
import { googleFontsUrl } from "@/lib/fonts";
import { fileUrl } from "@/lib/storage";
import { onColor } from "@/lib/color";
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

const themeInit = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.dataset.theme='dark'}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const lang = await getLang();
  const b = s.branding;
  const radius = b.buttonStyle === "pill" ? "9999px" : b.buttonStyle === "square" ? "0.25rem" : "0.75rem";
  const css = `:root:root{--brand:${b.primary};--brand-ink:${onColor(b.primary)};--secondary:${b.secondary};--accent:${b.accent};--accent-ink:${onColor(b.accent)};--btn-radius:${radius};--font-body:'${b.fontLatin}';--font-body-ar:'${b.fontArabic}';--font-display:'${lang === "ar" ? b.fontArabic : b.fontLatin}';--font-heading:'${lang === "ar" ? b.fontArabic : b.fontLatin}'}`;
  return (
    <html lang={lang} dir={dirOf(lang)} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={googleFontsUrl(b.fontLatin, b.fontArabic)} />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-dvh antialiased">
        <ToastProvider>{children}</ToastProvider>
        <Analytics a={s.analytics} />
      </body>
    </html>
  );
}
