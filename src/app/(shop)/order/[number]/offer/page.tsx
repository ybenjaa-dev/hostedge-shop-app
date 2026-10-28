import { redirect } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import { getT } from "@/lib/i18n";
import { tr } from "@/lib/i18n-core";
import { formatMoney } from "@/lib/money";
import { fileUrl } from "@/lib/storage";
import { getAddonOffer } from "@/features/orders/addon";
import { addAddonAction } from "@/features/orders/addon-actions";

export const metadata = { title: "One more thing", robots: { index: false } };

/** Shown once, right after the order is placed. Nothing to offer (or window over) → straight to the thank-you page. */
export default async function OfferPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params;
  const { t: token = "" } = await searchParams;
  const done = `/order/${number}?t=${token}`;
  const offer = await getAddonOffer(number, token);
  if (!offer) redirect(done);
  const { lang, t } = await getT();
  const cur = offer.order.currency;
  const fmt = (n: number) => formatMoney(n, cur, lang);
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="flex items-center justify-center gap-2 text-sm font-bold text-ok"><CheckCircle2 className="size-5" aria-hidden />{t("upsell.kicker")} · <span dir="ltr" className="num">#{number}</span></p>
      <h1 className="display mt-3 text-center text-3xl font-extrabold">{t("upsell.title")}</h1>
      <p className="mt-2 text-center text-muted">{t("upsell.sub")}</p>
      <ul className="mt-8 space-y-4">
        {offer.items.map((i) => (
          <li key={i.id} className="card overflow-hidden">
            <div className="flex gap-4 p-4">
              <span className="relative block size-24 shrink-0 overflow-hidden rounded-2xl bg-sunken">{i.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(i.image, "md")} alt="" className="size-full object-cover" />}<span className="absolute start-1 top-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-accent-ink">{t("upsell.off", { pct: offer.pct })}</span></span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-bold leading-snug">{tr(i.name, lang)}{i.variantName ? <span className="font-normal text-muted"> · {i.variantName}</span> : null}</p>
                <p className="mt-1 flex items-baseline gap-2"><span dir="ltr" className="num display text-xl font-extrabold text-brand">{fmt(i.offerPrice)}</span><span dir="ltr" className="num text-sm text-muted line-through">{fmt(i.price)}</span></p>
                <form action={addAddonAction} className="mt-3">
                  <input type="hidden" name="number" value={number} /><input type="hidden" name="token" value={token} /><input type="hidden" name="product" value={i.id} />
                  <button className="btn btn-primary w-full"><Plus className="size-5" aria-hidden />{t("upsell.add")}</button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-xs text-muted">{t("cod.payOnDelivery")}</p>
      <div className="mt-6 text-center"><a href={done} className="btn btn-ghost">{t("upsell.skip")}</a></div>
    </div>
  );
}
