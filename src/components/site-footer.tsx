import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Phone, Mail, MapPin, Clock, Music2, Ghost, Info } from "lucide-react";
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
  const a = "text-white/75 hover:text-accent hover:underline underline-offset-4";
  const h = "mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-accent";
  return (
    <footer className="mt-20 rounded-t-[2.25rem] bg-secondary text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-8 pt-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display text-3xl font-extrabold">{logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={s.store.name} className="h-10 w-auto brightness-0 invert" /> : s.store.name}</p>
          {(tr(s.footer.text, lang) || tr(s.store.tagline, lang)) && <p className="mt-3 max-w-sm text-white/70">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-white/25 transition hover:bg-accent hover:text-secondary"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h2 className={h}>{t("footer.pages")}</h2>
          <ul className="space-y-2.5 text-[0.95rem]">
            {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>))}
            <li><Link href="/track" className={a}>{t("nav.track")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={h}>{t("footer.contact")}</h2>
          <ul className="space-y-3 text-[0.95rem] text-white/80">
            {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center gap-2"><Phone className="size-4 shrink-0 text-accent" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={a}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
            {s.store.whatsapp && (<li className="flex items-center gap-2"><MessageCircle className="size-4 shrink-0 text-accent" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={a}>{t("common.whatsapp")}</a></li>)}
            {s.store.email && (<li className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-accent" /><a href={`mailto:${s.store.email}`} className={a}>{s.store.email}</a></li>)}
            {tr(s.store.address, lang) && (<li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-accent" />{tr(s.store.address, lang)}</li>)}
            {tr(s.store.hours, lang) && (<li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0 text-accent" />{tr(s.store.hours, lang)}</li>)}
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-5 pb-28 md:pb-10">
        <p className="flex gap-2.5 rounded-2xl border border-white/15 bg-white/5 p-4 text-xs leading-relaxed text-white/70"><Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />{t("p.disclaimer")}</p>
        <p className="mt-6 text-xs text-white/50">© {new Date().getFullYear()} {s.store.name} · {t("footer.rights")}</p>
      </div>
    </footer>
  );
}
