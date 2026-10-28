import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Music2, Ghost, ArrowUp } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { whatsappLink, formatPhoneIntl } from "@/lib/phone";
import { fileUrl } from "@/lib/storage";

/** Maison footer: centred wordmark and tagline, hairline, four quiet columns. */
export function SiteFooter({ s, lang, t, pages, categories }: { s: Settings; lang: Lang; t: TFn; pages: { slug: string; title: string }[]; categories?: { slug: string; name: string }[] }) {
  const so = s.social;
  const socials = [
    [so.instagram, Instagram, "Instagram"], [so.facebook, Facebook, "Facebook"], [so.tiktok, Music2, "TikTok"], [so.snapchat, Ghost, "Snapchat"],
    [so.youtube, Youtube, "YouTube"], [so.x, Twitter, "X"], [so.whatsappChannel, MessageCircle, "WhatsApp channel"],
  ] as const;
  const logo = fileUrl(s.branding.logo);
  const a = "lx-link text-muted";
  const h = "eyebrow mb-5";
  const addr = tr(s.store.address, lang);
  const hours = tr(s.store.hours, lang);
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[100rem] px-6 pb-10 pt-20 md:px-12">
        <div className="text-center">
          <div className="lx-ornament mb-8"><i /></div>
          <p className="display text-4xl uppercase tracking-[0.3em] md:text-6xl rtl:tracking-normal">{logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={s.store.name} className="brand-logo mx-auto h-10 w-auto" /> : s.store.name}</p>
          <p className="display mx-auto mt-5 max-w-md text-xl italic text-muted md:text-2xl">{tr(s.footer.text, lang) || tr(s.store.tagline, lang)}</p>
          {socials.some(([u]) => u) && (
            <div className="mt-8 flex flex-wrap justify-center gap-5">
              {socials.filter(([u]) => u).map(([u, Icon, label]) => (
                <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border border-line text-muted transition-colors duration-500 hover:border-brand hover:text-brand"><Icon className="size-4" /></a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 grid gap-12 border-t border-line pt-14 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className={h}>{t("lux.collections")}</h2>
            <ul className="space-y-3">
              <li><Link href="/shop" className={a}>{t("nav.shop")}</Link></li>
              {(categories ?? []).map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className={a}>{tr(c.name, lang)}</Link></li>)}
            </ul>
          </div>
          <div>
            <h2 className={h}>{t("lux.maison")}</h2>
            <ul className="space-y-3">
              {pages.map((p) => (<li key={p.slug}><Link href={`/page/${p.slug}`} className={a}>{tr(p.title, lang)}</Link></li>))}
              <li><Link href="/track" className={a}>{t("nav.track")}</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h2 className={h}>{t("lux.concierge")}</h2>
            <ul className="space-y-3 text-muted">
              {s.store.phones.filter(Boolean).map((p) => (<li key={p}><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className="lx-link inline-block">{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>))}
              {s.store.whatsapp && (<li><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className="lx-link">{t("common.whatsapp")}</a></li>)}
              {s.store.email && (<li><a href={`mailto:${s.store.email}`} className="lx-link">{s.store.email}</a></li>)}
              {addr && <li>{addr}</li>}
              {hours && <li>{hours}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 border-t border-line pt-8 pb-20 text-center md:flex-row md:justify-between md:pb-4 md:text-start">
          <p className="caps text-[0.62rem] text-muted">© {new Date().getFullYear()} {s.store.name}. {t("footer.rights")}</p>
          <a href="#main" className="caps group flex items-center gap-3 text-[0.62rem] text-muted transition-colors hover:text-brand"><ArrowUp className="size-3.5 transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.4} aria-hidden />{t("lux.backTop")}</a>
        </div>
      </div>
    </footer>
  );
}
