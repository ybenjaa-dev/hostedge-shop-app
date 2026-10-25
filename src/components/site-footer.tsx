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
  const link = "underline-offset-4 hover:underline";
  return (
    <footer className="mt-24 border-t-2 border-ink bg-[#111] pb-28 text-white md:pb-10">
      <div className="overflow-hidden border-b-2 border-white/20 px-4 py-8">
        <p className="display mx-auto max-w-7xl select-none break-words text-[clamp(3rem,13vw,10rem)] font-extrabold uppercase leading-[0.85] text-brand">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={s.store.name} className="h-20 w-auto sm:h-32" />
          ) : (
            s.store.name
          )}
        </p>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="max-w-md text-base leading-relaxed text-white/75">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center border-2 border-white bg-transparent text-white transition hover:bg-brand hover:text-brand-ink"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-accent">{t("footer.pages")}</h2>
          <ul className="space-y-2.5 text-sm font-semibold">
            {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={link}>{tr(p.title, lang)}</Link></li>))}
            <li><Link href="/track" className={link}>{t("nav.track")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-accent">{t("footer.contact")}</h2>
          <ul className="space-y-3 text-sm font-semibold">
            {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center gap-2"><Phone className="size-4 shrink-0" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={link}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
            {s.store.whatsapp && (<li className="flex items-center gap-2"><MessageCircle className="size-4 shrink-0" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={link}>{t("common.whatsapp")}</a></li>)}
            {s.store.email && (<li className="flex items-center gap-2"><Mail className="size-4 shrink-0" /><a href={`mailto:${s.store.email}`} className={link}>{s.store.email}</a></li>)}
            {tr(s.store.address, lang) && (<li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{tr(s.store.address, lang)}</li>)}
            {tr(s.store.hours, lang) && (<li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" />{tr(s.store.hours, lang)}</li>)}
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl px-4 text-xs font-bold uppercase tracking-widest text-white/50">© {new Date().getFullYear()} {s.store.name} · {t("footer.rights")}</p>
    </footer>
  );
}
