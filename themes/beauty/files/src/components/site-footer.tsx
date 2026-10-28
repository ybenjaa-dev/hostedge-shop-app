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
  const a = "hover:text-brand hover:underline underline-offset-4";
  return (
    <footer className="mt-24 rounded-t-[2.5rem] bg-sunken pb-28 pt-14 md:pb-12">
      <div className="mx-auto max-w-7xl px-5">
        <div className="text-center">
          <p className="display text-[2.6rem] italic sm:text-6xl">{logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={s.store.name} className="brand-logo mx-auto h-14 w-auto" /> : s.store.name}</p>
          {(tr(s.footer.text, lang) || tr(s.store.tagline, lang)) && <p className="mx-auto mt-3 max-w-md text-muted">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full border border-line bg-surface text-ink transition hover:bg-brand hover:text-brand-ink"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-10 border-t border-line pt-10 text-center sm:grid-cols-2 sm:text-start">
          <div>
            <h2 className="eyebrow mb-4">{t("footer.pages")}</h2>
            <ul className="space-y-2.5 text-[0.95rem]">
              {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>))}
              <li><Link href="/track" className={a}>{t("nav.track")}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="eyebrow mb-4">{t("footer.contact")}</h2>
            <ul className="space-y-3 text-[0.95rem]">
              {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center justify-center gap-2 sm:justify-start"><Phone className="size-4 shrink-0 text-muted" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={a}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
              {s.store.whatsapp && (<li className="flex items-center justify-center gap-2 sm:justify-start"><MessageCircle className="size-4 shrink-0 text-muted" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={a}>{t("common.whatsapp")}</a></li>)}
              {s.store.email && (<li className="flex items-center justify-center gap-2 sm:justify-start"><Mail className="size-4 shrink-0 text-muted" /><a href={`mailto:${s.store.email}`} className={a}>{s.store.email}</a></li>)}
              {tr(s.store.address, lang) && (<li className="flex items-start justify-center gap-2 sm:justify-start"><MapPin className="mt-0.5 size-4 shrink-0 text-muted" />{tr(s.store.address, lang)}</li>)}
              {tr(s.store.hours, lang) && (<li className="flex items-start justify-center gap-2 sm:justify-start"><Clock className="mt-0.5 size-4 shrink-0 text-muted" />{tr(s.store.hours, lang)}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-muted">© {new Date().getFullYear()} {s.store.name} · {t("footer.rights")}</p>
      </div>
    </footer>
  );
}
