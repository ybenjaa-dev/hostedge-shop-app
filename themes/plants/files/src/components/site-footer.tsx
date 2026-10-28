import Link from "next/link";
import { Instagram, Facebook, Youtube, XIcon as Twitter } from "./social-icons";
import { MessageCircle, Phone, Mail, MapPin, Clock, Music2, Ghost, ArrowUp } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { tr, type Lang } from "@/lib/i18n-core";
import type { TFn } from "@/lib/dict";
import { whatsappLink, formatPhoneIntl } from "@/lib/phone";
import { Wave, Sprig, Monstera, Sparkle } from "./botanical";

/** Planted-in-the-ground footer: scalloped grass edge, big wordmark, pill links and contact stickers. */
export function SiteFooter({ s, lang, t, pages, categories }: { s: Settings; lang: Lang; t: TFn; pages: { slug: string; title: string }[]; categories?: { slug: string; name: string }[] }) {
  const so = s.social;
  const socials = [
    [so.instagram, Instagram, "Instagram"], [so.facebook, Facebook, "Facebook"], [so.tiktok, Music2, "TikTok"], [so.snapchat, Ghost, "Snapchat"],
    [so.youtube, Youtube, "YouTube"], [so.x, Twitter, "X"], [so.whatsappChannel, MessageCircle, "WhatsApp channel"],
  ] as const;
  const pill = "inline-flex rounded-full border-2 border-[#9bd36a]/40 px-3 py-1 text-sm text-[#eaf4e2] transition hover:border-[#ffc83d] hover:bg-[#ffc83d] hover:text-[#1f3d2b]";
  const h = "display mb-3 text-lg text-[#ffc83d]";
  const contact = "flex items-start gap-2.5 rounded-2xl border-2 border-[#9bd36a]/40 bg-white/5 px-3 py-2 text-sm text-[#eaf4e2]";
  return (
    <footer className="relative mt-20 text-[#eaf4e2]">
      <div className="text-[#1f3d2b] dark:text-[#10261a]" aria-hidden><Wave className="-mb-px block h-8 w-full sm:h-12" /></div>
      <div className="relative overflow-hidden bg-[#1f3d2b] pb-32 md:pb-10 dark:bg-[#10261a]">
        <Monstera className="pointer-events-none absolute -bottom-6 -end-8 w-56 text-[#9bd36a]/25 sm:w-80" />
        <Sprig className="pointer-events-none absolute start-4 top-6 hidden w-20 rotate-[-12deg] text-[#9bd36a]/30 md:block" />
        <div className="relative mx-auto max-w-[78rem] px-5 pt-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="display text-4xl text-[#fffdf6] sm:text-6xl">{s.store.name}</p>
              <p className="mt-2 flex max-w-md items-center gap-2 text-[#cfe6c3]"><Sparkle className="size-5 shrink-0" />{tr(s.footer.text, lang) || tr(s.store.tagline, lang) || t("footer.grow")}</p>
            </div>
            <a href="#main" className="btn btn-accent btn-sm"><ArrowUp className="size-4" aria-hidden />{t("common.skip")}</a>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]">
            <div>
              <h2 className={h}>{t("footer.explore")}</h2>
              <ul className="flex flex-wrap gap-2">
                <li><Link href="/shop" className={pill}>{t("nav.shop")}</Link></li>
                {(categories ?? []).map((c) => <li key={c.slug}><Link href={`/category/${c.slug}`} className={pill}>{tr(c.name, lang)}</Link></li>)}
              </ul>
            </div>
            <div>
              <h2 className={h}>{t("footer.pages")}</h2>
              <ul className="flex flex-wrap gap-2">
                {pages.map((p) => <li key={p.slug}><Link href={`/page/${p.slug}`} className={pill}>{tr(p.title, lang)}</Link></li>)}
                <li><Link href="/track" className={pill}>{t("nav.track")}</Link></li>
              </ul>
              {socials.some(([u]) => u) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {socials.filter(([u]) => u).map(([u, Icon, label]) => (
                    <a key={label} href={u} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid size-10 place-items-center rounded-full border-2 border-[#1f3d2b] bg-[#ffc83d] text-[#1f3d2b] shadow-[2px_2px_0_#9bd36a] transition hover:-translate-y-0.5 hover:bg-[#ff6b4a] hover:text-white"><Icon className="size-4" /></a>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className={h}>{t("footer.contact")}</h2>
              <ul className="grid gap-2">
                {s.store.phones.filter(Boolean).map((p) => <li key={p} className={contact}><Phone className="mt-0.5 size-4 shrink-0 text-[#ffc83d]" /><a href={`tel:+${p.replace(/\D/g, "")}`} dir="ltr" className="hover:underline">{formatPhoneIntl(p.replace(/\D/g, ""))}</a></li>)}
                {s.store.whatsapp && <li className={contact}><MessageCircle className="mt-0.5 size-4 shrink-0 text-[#ffc83d]" /><a href={whatsappLink(s.store.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:underline">{t("common.whatsapp")}</a></li>}
                {s.store.email && <li className={contact}><Mail className="mt-0.5 size-4 shrink-0 text-[#ffc83d]" /><a href={`mailto:${s.store.email}`} className="break-all hover:underline">{s.store.email}</a></li>}
                {tr(s.store.address, lang) && <li className={contact}><MapPin className="mt-0.5 size-4 shrink-0 text-[#ffc83d]" />{tr(s.store.address, lang)}</li>}
                {tr(s.store.hours, lang) && <li className={contact}><Clock className="mt-0.5 size-4 shrink-0 text-[#ffc83d]" />{tr(s.store.hours, lang)}</li>}
              </ul>
            </div>
          </div>

          <p className="mt-10 border-t-2 border-dashed border-[#9bd36a]/30 pt-5 text-center text-xs text-[#cfe6c3]">© {new Date().getFullYear()} {s.store.name}. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
