import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Music2, Ghost } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { whatsappLink, formatPhoneIntl } from "@/lib/phone";

export function SiteFooter({ s, lang, t, pages, categories }: { s: Settings; lang: Lang; t: TFn; pages: { slug: string; title: string }[]; categories?: { slug: string; name: string }[] }) {
  const so = s.social;
  const socials = [
    [so.instagram, Instagram, "Instagram"], [so.facebook, Facebook, "Facebook"], [so.tiktok, Music2, "TikTok"], [so.snapchat, Ghost, "Snapchat"],
    [so.youtube, Youtube, "YouTube"], [so.x, Twitter, "X"], [so.whatsappChannel, MessageCircle, "WhatsApp channel"],
  ] as const;
  const a = "text-muted hover:text-ink";
  const h = "micro mb-4";
  return (
    <footer className="mt-24 border-t border-line px-5 pb-28 pt-16 sm:px-10 lg:pb-10">
      <div className="grid gap-14 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <p className="display max-w-md text-4xl sm:text-5xl">{t("home.story")}</p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{tr(s.footer.text, lang) || tr(s.store.tagline, lang) || t("home.storyD")}</p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <h2 className={h}>{t("nav.collections")}</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className={a}>{t("nav.shop")}</Link></li>
              {(categories ?? []).map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className={a}>{tr(c.name, lang)}</Link></li>)}
            </ul>
          </div>
          <div>
            <h2 className={h}>{t("footer.pages")}</h2>
            <ul className="space-y-2 text-sm">
              {pages.map((p) => <li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>)}
              <li><Link href="/track" className={a}>{t("nav.track")}</Link></li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <h2 className={h}>{t("footer.showroom")}</h2>
            <ul className="space-y-2 text-sm text-muted">
              {tr(s.store.address, lang) && <li>{tr(s.store.address, lang)}</li>}
              {tr(s.store.hours, lang) && <li>{tr(s.store.hours, lang)}</li>}
              {s.store.phones.filter(Boolean).map((p) => <li key={p}><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={a}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>)}
              {s.store.whatsapp && <li><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={a}>{t("common.whatsapp")}</a></li>}
              {s.store.email && <li><a href={`mailto:${s.store.email}`} className={a}>{s.store.email}</a></li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-xs text-muted">
        <p>© {new Date().getFullYear()} {s.store.name}. {t("footer.rights")}</p>
        <div className="flex gap-4">
          {socials.filter(([u]) => u).map(([u, Icon, label]) => <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-muted hover:text-brand"><Icon className="size-4" /></a>)}
        </div>
      </div>
    </footer>
  );
}
