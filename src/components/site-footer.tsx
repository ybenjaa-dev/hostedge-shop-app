import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Phone, Mail, MapPin, Clock, Music2, Ghost } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { whatsappLink, formatPhoneIntl } from "@/lib/phone";
import { fileUrl } from "@/lib/storage";

export function SiteFooter({ s, lang, t, pages }: { s: Settings; lang: Lang; t: TFn; pages: { slug: string; title: string }[] }) {
  const so = s.social;
  const socials = [
    [so.instagram, Instagram, "Instagram"], [so.facebook, Facebook, "Facebook"], [so.tiktok, Music2, "TikTok"], [so.snapchat, Ghost, "Snapchat"],
    [so.youtube, Youtube, "YouTube"], [so.x, Twitter, "X"], [so.whatsappChannel, MessageCircle, "WhatsApp channel"],
  ] as const;
  const logo = fileUrl(s.branding.logo);
  return (
    <footer className="mt-20 border-t border-line bg-sunken pb-24 pt-12 md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-2xl font-extrabold">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={s.store.name} className="brand-logo h-10 w-auto" />
            ) : (
              s.store.name
            )}
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-line bg-surface hover:border-brand hover:text-brand"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider">{t("footer.pages")}</h2>
          <ul className="space-y-2 text-sm text-muted">
            {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className="hover:text-ink hover:underline">{tr(p.title, lang)}</Link></li>))}
            <li><Link href="/track" className="hover:text-ink hover:underline">{t("nav.track")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider">{t("footer.contact")}</h2>
          <ul className="space-y-2.5 text-sm text-muted">
            {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center gap-2"><Phone className="size-4 shrink-0" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className="hover:text-ink">{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
            {s.store.whatsapp && (<li className="flex items-center gap-2"><MessageCircle className="size-4 shrink-0" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-ink">{t("common.whatsapp")}</a></li>)}
            {s.store.email && (<li className="flex items-center gap-2"><Mail className="size-4 shrink-0" /><a href={`mailto:${s.store.email}`} className="hover:text-ink">{s.store.email}</a></li>)}
            {tr(s.store.address, lang) && (<li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{tr(s.store.address, lang)}</li>)}
            {tr(s.store.hours, lang) && (<li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" />{tr(s.store.hours, lang)}</li>)}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-7xl px-4 text-xs text-muted">© {new Date().getFullYear()} {s.store.name}. {t("footer.rights")}</p>
    </footer>
  );
}
