import { ExternalLink, Check } from "lucide-react";
import { getEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n";
import { normalizePhone } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { statusInfo } from "@/lib/status-labels";
import { customerTimeline, type OrderStatus } from "@/lib/order-status";
import { trackingUrl } from "@/features/shipping/tracking-url";
import { Money } from "@/components/money";
import { SubmitButton } from "@/components/ui/submit";

export const metadata = { title: "Track your order", robots: { index: false } };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ number?: string; phone?: string }> }) {
  const sp = await searchParams;
  const s = await getSettings();
  const { lang, t } = await getT();
  const num = (sp.number ?? "").replace(/[^\d]/g, "");
  let order: Record<string, string | number | null> | null = null;
  let history: { to_status: string; created_at: number }[] = [];
  let notFound = false;
  if (num && sp.phone) {
    const rl = await rateLimit(`track:${await clientIp()}`, 15, 600);
    const ph = normalizePhone(sp.phone, s.store.country);
    if (rl.ok && ph.ok) {
      order = await getEnv().DB.prepare("SELECT * FROM orders WHERE number = ? AND phone = ?").bind(num, ph.e164).first();
      if (order) history = (await getEnv().DB.prepare("SELECT to_status, created_at FROM order_history WHERE order_id = ? ORDER BY created_at").bind(order.id).all<{ to_status: string; created_at: number }>()).results;
    }
    notFound = !order;
  }
  const info = order ? statusInfo(s, order.status as string, lang) : null;
  const reached = new Set(history.map((h) => h.to_status));
  const cur = order?.status as OrderStatus | undefined;
  const failed = cur && ["cancelled", "returned", "return_received", "refunded", "delivery_failed", "no_answer", "postponed"].includes(cur);
  const link = order ? trackingUrl(order.carrier_id as string | null, order.tracking_number as string | null) : null;
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="display mb-6 text-3xl font-extrabold sm:text-4xl">{t("track.title")}</h1>
      <form className="card space-y-4 p-5" method="get">
        <div><label className="label" htmlFor="tn">{t("track.number")}</label><input id="tn" name="number" inputMode="numeric" defaultValue={sp.number ?? ""} className="field" required placeholder="1001" /></div>
        <div><label className="label" htmlFor="tp">{t("track.phone")}</label><input id="tp" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={sp.phone ?? ""} className="field" required /></div>
        <SubmitButton className="btn btn-primary w-full">{t("track.find")}</SubmitButton>
      </form>
      {notFound && <p role="alert" className="mt-6 rounded-xl bg-danger/10 p-4 text-sm font-medium text-danger">{t("track.notfound")}</p>}
      {order && info && (
        <section className="card mt-6 p-5" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm text-muted">#{order.number} · {t("track.placed", { date: new Date(order.created_at as number).toLocaleDateString(lang === "ar" ? "ar-MA-u-nu-latn" : lang) })}</p><p className="mt-1 text-xl font-extrabold" style={{ color: info.color }}>{info.label}</p></div>
            <Money amount={order.total as number} currency={order.currency as string} lang={lang} className="text-lg font-extrabold" />
          </div>
          {!failed ? (
            <ol className="mt-6 space-y-0">
              {customerTimeline.map((st, i) => {
                const idx = customerTimeline.indexOf(cur ?? "new");
                const done = i <= idx || reached.has(st);
                return (
                  <li key={st} className="relative flex gap-3 pb-6 last:pb-0">
                    {i < customerTimeline.length - 1 && <span className={`absolute start-[0.8rem] top-7 h-[calc(100%-1.75rem)] w-0.5 ${i < idx ? "bg-brand" : "bg-line"}`} />}
                    <span className={`relative grid size-7 shrink-0 place-items-center rounded-full border-2 ${done ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"}`}>{done && <Check className="size-4" />}</span>
                    <span className={`pt-0.5 font-semibold ${done ? "" : "text-muted"}`}>{statusInfo(s, st, lang).label}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <p className="font-bold">{t("track.history")}</p>
              {history.map((h, i) => <li key={i} className="flex justify-between"><span>{statusInfo(s, h.to_status, lang).label}</span><span className="text-muted">{new Date(h.created_at).toLocaleDateString(lang)}</span></li>)}
            </ul>
          )}
          {order.tracking_number && (
            <div className="mt-6 rounded-xl bg-sunken p-4 text-sm">
              <p className="text-muted">{t("track.tracking")}</p>
              <p dir="ltr" className="num text-base font-bold">{order.tracking_number as string}</p>
              {link && <a href={link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold text-brand hover:underline">{t("track.followCarrier")} <ExternalLink className="size-4" /></a>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
