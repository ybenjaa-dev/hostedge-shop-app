import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Phone, Mail, MapPin, Clock, Music2, Ghost, ArrowUp } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { whatsappLink, formatPhoneIntl } from "@/lib/phone";

/** Oversized outlined wordmark over a slanted lime edge, then a compact link matrix. */
export function SiteFooter({ s, lang, t, pages, categories }: { s: Settings; lang: Lang; t: TFn; pages: { slug: string; title: string }[]; categories?: { slug: string; name: string }[] }) {
  const so = s.social;
  const socials = [
    [so.instagram, Instagram, "Instagram"], [so.facebook, Facebook, "Facebook"], [so.tiktok, Music2, "TikTok"], [so.snapchat, Ghost, "Snapchat"],
    [so.youtube, Youtube, "YouTube"], [so.x, Twitter, "X"], [so.whatsappChannel, MessageCircle, "WhatsApp channel"],
  ] as const;
  const a = "text-muted hover:text-[var(--brand)]";
  const h = "mb-4 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand)]";
  return (
    <footer className="relative mt-16 bg-surface">
      <div className="lime slant-top flex items-center justify-between gap-4 px-4 pb-4 sm:px-8">
        <p className="display text-2xl sm:text-4xl">{t("sp.gear")} →</p>
        <a href="#main" className="btn btn-accent btn-sm"><ArrowUp className="size-4" aria-hidden />{t("sp.back")}</a>
      </div>
      <div className="mx-auto max-w-[90rem] overflow-hidden px-4 pt-8 sm:px-8">
        <p dir="auto" aria-hidden className="display outline-text select-none whitespace-nowrap text-center text-[clamp(3.5rem,15vw,12rem)] leading-[0.85]" style={{ ["--stroke" as string]: "var(--rule)" }}>{s.store.name}</p>
      </div>
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <p className="max-w-xs text-sm leading-relaxed text-muted">{tr(s.footer.text, lang) || tr(s.store.tagline, lang) || t("sp.dropsSub")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socials.filter(([u]) => u).map(([u, Icon, label]) => (
              <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="skew grid size-10 place-items-center bg-sunken hover:bg-[var(--brand)] hover:text-black"><Icon className="size-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h2 className={h}>{t("shop.category")}</h2>
          <ul className="space-y-2 text-sm font-semibold">
            <li><Link href="/shop" className={a}>{t("nav.shop")}</Link></li>
            {(categories ?? []).map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className={a}>{tr(c.name, lang)}</Link></li>)}
          </ul>
        </div>
        <div>
          <h2 className={h}>{t("footer.pages")}</h2>
          <ul className="space-y-2 text-sm font-semibold">
            {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>))}
            <li><Link href="/track" className={a}>{t("nav.track")}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className={h}>{t("footer.contact")}</h2>
          <ul className="space-y-2.5 text-sm text-muted">
            {s.store.phones.filter(Boolean).map((p) => (<li key={p} className="flex items-center gap-2"><Phone className="size-4 shrink-0" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className={a}>{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
            {s.store.whatsapp && (<li className="flex items-center gap-2"><MessageCircle className="size-4 shrink-0" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className={a}>{t("common.whatsapp")}</a></li>)}
            {s.store.email && (<li className="flex items-center gap-2"><Mail className="size-4 shrink-0" /><a href={`mailto:${s.store.email}`} className={a}>{s.store.email}</a></li>)}
            {tr(s.store.address, lang) && (<li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" />{tr(s.store.address, lang)}</li>)}
            {tr(s.store.hours, lang) && (<li className="flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" />{tr(s.store.hours, lang)}</li>)}
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 pb-24 text-center text-xs uppercase tracking-widest text-muted md:pb-4">© {new Date().getFullYear()} {s.store.name}. {t("footer.rights")}</div>
    </footer>
  );
}
