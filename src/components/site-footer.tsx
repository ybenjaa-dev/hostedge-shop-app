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
  const link = "decoration-gold underline-offset-4 hover:underline";
  const h = "heading mb-4 text-xl text-[#e3c36f]";
  return (
    <footer className="mt-24 bg-navy text-[#f6efd9]">
      <div className="bg-zel-w scallop-top bg-navy pb-28 pt-8 md:pb-10" style={{ ["--r" as string]: "16px" }}>
        <div className="mx-auto max-w-7xl px-4 pt-10 text-center">
          <p className="heading text-4xl text-[#e3c36f] sm:text-5xl">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={s.store.name} className="mx-auto h-14 w-auto" />
            ) : (
              <><span className="orn me-3 !size-7 align-[-3px]" aria-hidden />{s.store.name}<span className="orn ms-3 !size-7 align-[-3px]" aria-hidden /></>
            )}
          </p>
          {(tr(s.footer.text, lang) || tr(s.store.tagline, lang)) && <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#f6efd9]/80">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-11 place-items-center rounded-full border border-[#c9a24b] text-[#e3c36f] transition hover:bg-[#c9a24b] hover:text-navy"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div className="rule mx-auto my-10 max-w-3xl px-4"><span className="orn" /></div>
        <div className="mx-auto grid max-w-5xl gap-10 px-6 text-center sm:grid-cols-2 sm:text-start">
          <div>
            <h2 className={h}>{t("footer.pages")}</h2>
            <ul className="space-y-2.5 text-[0.95rem]">
              {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={link}>{tr(p.title, lang)}</Link></li>))}
              <li><Link href="/track" className={link}>{t("nav.track")}</Link></li>
            </ul>
          </div>
          <div>
            <h2 className={h}>{t("footer.contact")}</h2>
            <ul className="space-y-3 text-[0.95rem]">
              {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center justify-center gap-2 sm:justify-start"><Phone className="size-4 shrink-0 text-[#c9a24b]" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={link}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
              {s.store.whatsapp && (<li className="flex items-center justify-center gap-2 sm:justify-start"><MessageCircle className="size-4 shrink-0 text-[#c9a24b]" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={link}>{t("common.whatsapp")}</a></li>)}
              {s.store.email && (<li className="flex items-center justify-center gap-2 sm:justify-start"><Mail className="size-4 shrink-0 text-[#c9a24b]" /><a href={`mailto:${s.store.email}`} className={link}>{s.store.email}</a></li>)}
              {tr(s.store.address, lang) && (<li className="flex items-start justify-center gap-2 sm:justify-start"><MapPin className="mt-0.5 size-4 shrink-0 text-[#c9a24b]" />{tr(s.store.address, lang)}</li>)}
              {tr(s.store.hours, lang) && (<li className="flex items-start justify-center gap-2 sm:justify-start"><Clock className="mt-0.5 size-4 shrink-0 text-[#c9a24b]" />{tr(s.store.hours, lang)}</li>)}
            </ul>
          </div>
        </div>
        <p className="mt-12 text-center text-xs text-[#f6efd9]/55">© {new Date().getFullYear()} {s.store.name} · {t("footer.rights")}</p>
      </div>
    </footer>
  );
}
