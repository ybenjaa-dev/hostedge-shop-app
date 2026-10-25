import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MessageCircle, PackageSearch } from "lucide-react";
import { getEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { orderToken } from "@/features/orders/service";
import { Money } from "@/components/money";
import { whatsappLink } from "@/lib/phone";
import { fileUrl } from "@/lib/storage";

export const metadata = { title: "Order confirmed", robots: { index: false } };

export default async function OrderDonePage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params;
  const { t: token } = await searchParams;
  const db = getEnv().DB;
  const o = await db.prepare("SELECT * FROM orders WHERE number = ?").bind(number).first<Record<string, string | number | null>>();
  if (!o || !token || token !== (await orderToken(number, o.phone as string))) notFound();
  const items = (await db.prepare("SELECT name, variant_name AS variantName, qty, price, image FROM order_items WHERE order_id = ?").bind(o.id).all<{ name: string; variantName: string | null; qty: number; price: number; image: string | null }>()).results;
  const s = await getSettings();
  const { lang, t } = await getT();
  const cur = o.currency as string;
  const msg = `${tr(s.templates.confirm, lang)}`.replace("{name}", o.name as string).replace("{store}", s.store.name).replace("{order}", `#${number}`).replace("{total}", String(o.total));
  const wa = s.store.whatsapp ? whatsappLink(s.store.whatsapp, `#${number} — ${o.name}`) : null;
  void msg;
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-brand-soft text-brand"><CheckCircle2 className="size-11" /></span>
        <h1 className="display mt-5 text-3xl font-extrabold">{t("done.title")}</h1>
        <p className="mt-2 text-muted">{t("done.pending")}</p>
        <p className="mt-6 text-sm text-muted">{t("done.number")}</p>
        <p className="display num text-4xl font-extrabold text-brand" dir="ltr">#{number}</p>
      </div>
      <section className="card mt-8 divide-y divide-line">
        <ul className="divide-y divide-line px-4">
          {items.map((i, k) => (
            <li key={k} className="flex items-center gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image && <img src={fileUrl(i.image)} alt="" className="size-14 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1"><p className="truncate font-semibold">{tr(i.name, lang)}</p><p className="text-sm text-muted">{i.variantName ? `${i.variantName} · ` : ""}{i.qty} ×</p></div>
              <Money amount={i.price * i.qty} currency={cur} lang={lang} className="font-bold" />
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 p-4 text-sm">
          <div className="flex justify-between"><dt>{t("cod.subtotal")}</dt><dd><Money amount={o.subtotal as number} currency={cur} lang={lang} /></dd></div>
          {(o.discount as number) > 0 && <div className="flex justify-between text-ok"><dt>{t("cod.discount")}</dt><dd>−<Money amount={o.discount as number} currency={cur} lang={lang} /></dd></div>}
          <div className="flex justify-between"><dt>{t("cod.shipping")}</dt><dd>{(o.shipping as number) === 0 ? t("cod.free") : <Money amount={o.shipping as number} currency={cur} lang={lang} />}</dd></div>
          {(o.cod_fee as number) > 0 && <div className="flex justify-between"><dt>{t("cod.codFee")}</dt><dd><Money amount={o.cod_fee as number} currency={cur} lang={lang} /></dd></div>}
          <div className="flex items-baseline justify-between border-t border-line pt-3 text-base font-extrabold"><dt>{t("done.total")}</dt><dd className="text-xl text-brand"><Money amount={o.total as number} currency={cur} lang={lang} /></dd></div>
        </dl>
        <div className="p-4 text-sm text-muted"><p className="font-semibold text-ink">{o.name as string} · <bdi dir="ltr">+{o.phone as string}</bdi></p><p>{o.address as string}, {o.city as string}</p></div>
      </section>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-lg bg-[#25D366] text-white hover:opacity-90"><MessageCircle className="size-5" />{t("done.whatsapp")}</a>}
        <Link href={`/track?number=${number}`} className="btn btn-outline btn-lg"><PackageSearch className="size-5" />{t("done.track")}</Link>
      </div>
      <Link href="/shop" className="btn btn-ghost mt-3 w-full">{t("done.continue")}</Link>
    </div>
  );
}
