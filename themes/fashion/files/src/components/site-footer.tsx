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
  const a = "text-white/70 hover:text-white hover:underline underline-offset-4";
  return (
    <footer className="mt-24 bg-[#0d0d0d] text-white">
      <div className="mx-auto max-w-[88rem] px-5 pt-14">
        <p className="display select-none break-words text-[clamp(3rem,15vw,12rem)] leading-[0.82] tracking-tight">{logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={s.store.name} className="brand-logo h-20 w-auto brightness-0 invert sm:h-32" /> : s.store.name}</p>
        <div className="mt-12 grid gap-10 border-t border-white/15 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div><h2 className="label-s mb-4 text-white/50">{t("footer.pages")}</h2><ul className="space-y-2.5 text-sm">{pages.map((p) => <li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>)}<li><Link href="/track" className={a}>{t("nav.track")}</Link></li></ul></div>
          <div><h2 className="label-s mb-4 text-white/50">{t("footer.contact")}</h2>
            <ul className="space-y-2.5 text-sm text-white/80">
              {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center gap-2"><Phone className="size-4 shrink-0" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={a}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
              {s.store.whatsapp && <li className="flex items-center gap-2"><MessageCircle className="size-4 shrink-0" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={a}>{t("common.whatsapp")}</a></li>}
              {s.store.email && <li className="flex items-center gap-2"><Mail className="size-4 shrink-0" /><a href={`mailto:${s.store.email}`} className={a}>{s.store.email}</a></li>}
              {tr(s.store.address, lang) && <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{tr(s.store.address, lang)}</li>}
              {tr(s.store.hours, lang) && <li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" />{tr(s.store.hours, lang)}</li>}
            </ul></div>
          <div className="lg:col-span-2"><h2 className="label-s mb-4 text-white/50">{t("footer.follow")}</h2>
            <div className="flex flex-wrap gap-2">{socials.filter(([u]) => u).map(([u, Icon, label]) => <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center border border-white/30 transition hover:bg-white hover:text-black"><Icon className="size-4" /></a>)}</div>
            {(tr(s.footer.text, lang) || tr(s.store.tagline, lang)) && <p className="mt-5 max-w-md text-sm text-white/60">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>}</div>
        </div>
        <p className="label-s mt-12 pb-28 text-white/40 md:pb-10">© {new Date().getFullYear()} {s.store.name} · {t("footer.rights")}</p>
      </div>
    </footer>
  );
}
