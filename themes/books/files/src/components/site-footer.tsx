import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Phone, Mail, MapPin, Clock, Music2, Ghost } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { whatsappLink, formatPhoneIntl } from "@/lib/phone";

/** Colophon-style footer: pull-quote, then four ruled columns, closed with a "fin" ornament. */
export function SiteFooter({ s, lang, t, pages, categories }: { s: Settings; lang: Lang; t: TFn; pages: { slug: string; title: string }[]; categories?: { slug: string; name: string }[] }) {
  const so = s.social;
  const socials = [
    [so.instagram, Instagram, "Instagram"], [so.facebook, Facebook, "Facebook"], [so.tiktok, Music2, "TikTok"], [so.snapchat, Ghost, "Snapchat"],
    [so.youtube, Youtube, "YouTube"], [so.x, Twitter, "X"], [so.whatsappChannel, MessageCircle, "WhatsApp channel"],
  ] as const;
  const a = "text-muted hover:text-brand hover:underline underline-offset-4";
  const h = "eyebrow mb-4 border-b border-line pb-2";
  return (
    <footer className="mt-16">
      <div className="rule-double border-b border-line bg-brand text-brand-ink">
        <div className="mx-auto max-w-[80rem] px-4 py-10 text-center sm:py-14">
          <p className="display mx-auto max-w-3xl text-2xl italic sm:text-4xl" dir="auto">“{tr(s.footer.text, lang) || t("bk.footerQuote")}”</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] opacity-80 rtl:tracking-normal">— {s.store.name}</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-[80rem] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h2 className={h}>{s.store.name}</h2>
          <p className="text-sm leading-relaxed text-muted">{tr(s.store.tagline, lang) || t("bk.tagline")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-9 place-items-center rounded-full border border-rule hover:border-brand hover:bg-brand hover:text-brand-ink"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h2 className={h}>{t("bk.genres")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className={a}>{t("bk.allBooks")}</Link></li>
            {(categories ?? []).map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className={a}>{tr(c.name, lang)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className={h}>{t("footer.pages")}</h2>
          <ul className="space-y-2 text-sm">
            {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>))}
            <li><Link href="/track" className={a}>{t("nav.track")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={h}>{t("footer.contact")}</h2>
          <ul className="space-y-2.5 text-sm text-muted">
            {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-brand" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={a}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
            {s.store.whatsapp && (<li className="flex items-center gap-2"><MessageCircle className="size-4 shrink-0 text-brand" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={a}>{t("common.whatsapp")}</a></li>)}
            {s.store.email && (<li className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-brand" /><a href={`mailto:${s.store.email}`} className={a}>{s.store.email}</a></li>)}
            {tr(s.store.address, lang) && (<li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-brand" />{tr(s.store.address, lang)}</li>)}
            {tr(s.store.hours, lang) && (<li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-brand" />{tr(s.store.hours, lang)}</li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 pb-24 text-center md:pb-6">
        <p className="display text-xl text-brand" aria-hidden>❦</p>
        <p className="mt-1 text-xs text-muted">© {new Date().getFullYear()} {s.store.name}. {t("footer.rights")}</p>
      </div>
    </footer>
  );
}
