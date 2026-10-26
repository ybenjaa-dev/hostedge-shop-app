import { getEnv } from "@/lib/env";
import { getCapiSecrets, lastChars } from "@/features/tracking/capi";
import { sendTestEventAction, retryEventsAction } from "@/features/tracking/actions";
import { ActionButton } from "./action-button";
import { DataTable } from "./table";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, I18nField, Toggle } from "@/features/admin/components/fields";
import { Panel } from "@/features/admin/components/ui";
import type { Settings } from "@/lib/settings";
import { CURRENCIES, toMajorString } from "@/lib/money";
import { COUNTRIES } from "@/lib/phone";
import { allLangMetas, allLangs, labelOf } from "@/lib/i18n-core";
import { DEFAULT_STATUS_DEFS, ORDER_STATUSES } from "@/lib/order-status";
import { saveStore, saveSocial, saveCheckout, saveAnalytics, saveStatuses, saveTemplates, saveEngage } from "../actions/save";

export function StoreSection({ s }: { s: Settings }) {
  const st = s.store;
  return (
    <AdminForm action={saveStore} submitLabel="Save store settings">
      <Panel title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" htmlFor="name"><input id="name" name="name" defaultValue={st.name} required maxLength={80} className="field" /></Field>
          <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" defaultValue={st.email} className="field" autoComplete="off" /></Field>
        </div>
        <div className="mt-4"><I18nField label="Tagline" name="tagline" value={st.tagline} /></div>
      </Panel>
      <Panel title="Region & currency">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Home country" htmlFor="country">
            <select id="country" name="country" defaultValue={st.country} className="field">{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name.en}</option>)}</select>
          </Field>
          <Field label="Currency" htmlFor="currency" hint="Changing currency does not convert existing prices.">
            <select id="currency" name="currency" defaultValue={st.currency} className="field">{Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} — {v.name}</option>)}</select>
          </Field>
          <Field label="Default language" htmlFor="defaultLang">
            <select id="defaultLang" name="defaultLang" defaultValue={st.defaultLang} className="field">{allLangs().map((l) => <option key={l} value={l}>{labelOf(l)}</option>)}</select>
          </Field>
          <fieldset>
            <legend className="label">Enabled languages</legend>
            <div className="flex flex-wrap gap-3">{allLangs().map((l) => (
              <label key={l} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold"><input type="checkbox" name="langs" value={l} defaultChecked={st.langs.includes(l)} className="size-4 accent-[var(--brand)]" />{labelOf(l)}</label>
            ))}</div>
          </fieldset>
        </div>
        <fieldset className="mt-4">
          <legend className="label">Countries served</legend>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3">{COUNTRIES.map((c) => (
            <label key={c.code} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm"><input type="checkbox" name="countries" value={c.code} defaultChecked={st.countries.includes(c.code)} className="size-4 accent-[var(--brand)]" /><span aria-hidden>{c.flag}</span>{c.name.en}</label>
          ))}</div>
        </fieldset>
      </Panel>
      <Panel title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" htmlFor="whatsapp" hint="With country code, e.g. +212612345678"><input id="whatsapp" name="whatsapp" defaultValue={st.whatsapp} inputMode="tel" dir="ltr" className="field" /></Field>
          <Field label="Phone numbers (one per line)" htmlFor="phones"><textarea id="phones" name="phones" rows={3} defaultValue={st.phones.join("\n")} dir="ltr" className="field" /></Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <I18nField label="Address" name="address" value={st.address} textarea rows={2} />
          <I18nField label="Opening hours" name="hours" value={st.hours} textarea rows={2} />
        </div>
      </Panel>
      <Panel title="Tax">
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field label="Tax rate (%)" htmlFor="tax" hint="0 to disable. Stored as basis points."><input id="tax" name="tax" inputMode="decimal" defaultValue={String(st.taxRateBp / 100)} className="field num" /></Field>
          <Toggle name="taxInclusive" label="Prices include tax" hint="Off: tax is added on top at checkout." defaultChecked={st.taxInclusive} />
        </div>
      </Panel>
    </AdminForm>
  );
}

const SOCIAL: [keyof Settings["social"], string][] = [["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["snapchat", "Snapchat"], ["youtube", "YouTube"], ["x", "X (Twitter)"], ["whatsappChannel", "WhatsApp channel"]];
export function SocialSection({ s }: { s: Settings }) {
  return (
    <AdminForm action={saveSocial} submitLabel="Save social links">
      <Panel title="Social links" ><p className="mb-4 text-sm text-muted">Shown in the storefront footer. Leave empty to hide.</p>
        <div className="grid gap-4 sm:grid-cols-2">{SOCIAL.map(([k, label]) => (
          <Field key={k} label={label} htmlFor={`soc-${k}`}><input id={`soc-${k}`} name={k} type="url" inputMode="url" placeholder="https://" defaultValue={s.social[k]} dir="ltr" className="field" /></Field>
        ))}</div>
      </Panel>
    </AdminForm>
  );
}

export function CheckoutSection({ s }: { s: Settings }) {
  const c = s.checkout, cur = s.store.currency;
  const m = (n: number) => toMajorString(n, cur);
  return (
    <AdminForm action={saveCheckout} submitLabel="Save checkout settings">
      <Panel title="Cash on Delivery mode">
        <Toggle name="codMode" label="Cash on Delivery mode" defaultChecked={c.codMode}
          hint="ON: one-click COD order form on every product, no cart. OFF: classic cart and checkout." />
      </Panel>
      <Panel title={`Fees & shipping (${cur})`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="COD fee" htmlFor="codFee" hint="Added to each COD order. 0 = none."><input id="codFee" name="codFee" inputMode="decimal" defaultValue={m(c.codFee)} className="field num" /></Field>
          <Field label="Free-shipping threshold" htmlFor="fst" hint="0 = never free."><input id="fst" name="freeShippingThreshold" inputMode="decimal" defaultValue={m(c.freeShippingThreshold)} className="field num" /></Field>
          <Field label="Default shipping fee" htmlFor="dsf" hint="Used when a city has no fee."><input id="dsf" name="defaultShippingFee" inputMode="decimal" defaultValue={m(c.defaultShippingFee)} className="field num" /></Field>
        </div>
      </Panel>
      <Panel title="Order form">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Form placement" htmlFor="fp"><select id="fp" name="formPlacement" defaultValue={c.formPlacement} className="field">
            <option value="inline">Inline — opens when the customer taps “Order now”</option><option value="inline-open">Inline — form always visible on the product page</option><option value="popup">Popup (bottom sheet on phones)</option><option value="page">Separate checkout page</option></select></Field>
          <Field label="Duplicate-order window (minutes)" htmlFor="dw" hint="Same phone + same items within this window is treated as a duplicate. 0 = off."><input id="dw" name="duplicateWindowMin" type="number" min={0} max={1440} defaultValue={c.duplicateWindowMin} className="field num" /></Field>
          <Field label="Max orders per hour per IP" htmlFor="rip"><input id="rip" name="ratePerHourPerIp" type="number" min={1} max={1000} defaultValue={c.ratePerHourPerIp} className="field num" /></Field>
          <Field label="Max orders per day per phone" htmlFor="rph"><input id="rph" name="ratePerDayPerPhone" type="number" min={1} max={1000} defaultValue={c.ratePerDayPerPhone} className="field num" /></Field>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle name="confirmationStep" label="Confirmation step" hint="Show a review screen before sending the order." defaultChecked={c.confirmationStep} />
          <Toggle name="bundlesInForm" label="Quantity bundles in the form" hint="Offer “buy N, save P%” in the order form." defaultChecked={c.bundlesInForm} />
          <Toggle name="reviewsAutoApprove" label="Auto-approve reviews" hint="Off: reviews wait in the moderation queue." defaultChecked={c.reviewsAutoApprove} />
        </div>
      </Panel>
    </AdminForm>
  );
}

function AnalyticsInput({ k, label, ph, value }: { k: keyof Settings["analytics"]; label: string; ph: string; value: string }) {
  return (
    <Field label={label} htmlFor={`an-${k}`}><input id={`an-${k}`} name={k} defaultValue={value} placeholder={ph} pattern="[A-Za-z0-9_\-]{3,40}" maxLength={40} dir="ltr" className="field" autoComplete="off" /></Field>
  );
}
export async function AnalyticsSection({ s }: { s: Settings }) {
  const a = s.analytics;
  const secrets = await getCapiSecrets();
  const log = await getEnv().DB.prepare("SELECT t.event, t.platform, t.status, t.http_status AS http, t.response, t.attempts, t.updated_at AS at, o.number AS number FROM tracking_events t LEFT JOIN orders o ON o.id = t.order_id ORDER BY t.updated_at DESC LIMIT 30").all<{ event: string; platform: string; status: string; http: number | null; response: string | null; attempts: number; at: number; number: string | null }>();
  const failed = log.results.filter((r) => r.status === "error").length;
  return (
    <>
      <AdminForm action={saveAnalytics} submitLabel="Save tracking settings">
        <Panel title="Tracking IDs"><p className="mb-4 text-sm text-muted">Only the ID, not the full script. Letters, numbers, - and _ (3–40 chars).</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnalyticsInput k="metaPixel" label="Meta (Facebook) Pixel ID" ph="1234567890" value={a.metaPixel} /><AnalyticsInput k="tiktokPixel" label="TikTok Pixel ID" ph="C1ABCDEF" value={a.tiktokPixel} />
            <AnalyticsInput k="ga" label="Google Analytics ID" ph="G-XXXXXXXX" value={a.ga} /><AnalyticsInput k="snapPixel" label="Snapchat Pixel ID" ph="a1b2c3d4-…" value={a.snapPixel} />
          </div>
        </Panel>
        <Panel title="Server-side tracking (Conversions API)">
          <p className="mb-4 text-sm text-muted">Browsers and ad-blockers lose a lot of events. With an access token, every order is also sent from the server — matched to the browser pixel so it is never counted twice — and you decide when a sale really counts.</p>
          <fieldset className="mb-5">
            <legend className="label">Count a sale (Purchase) when the order is…</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {([["placed", "Placed", "Fastest signal, includes fake and unreachable orders."], ["confirmed", "Confirmed", "After your team phoned the customer. Best balance for COD."], ["delivered", "Delivered", "Only real, paid deliveries. Slowest, cleanest data."]] as const).map(([v, t, d]) => (
                <label key={v} className="flex cursor-pointer gap-3 rounded-xl border border-line bg-surface p-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft"><input type="radio" name="purchaseWhen" value={v} defaultChecked={a.capi.purchaseWhen === v} className="mt-1 accent-[var(--brand)]" /><span><span className="block font-bold">{t}</span><span className="text-xs text-muted">{d}</span></span></label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Until then the browser pixel sends a <b>Lead</b> instead of a purchase, so ad platforms don’t optimise for orders that never ship.</p>
          </fieldset>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-line p-4">
              <h3 className="display font-extrabold">Meta (Facebook / Instagram)</h3>
              <Field label="Conversions API access token" htmlFor="metaToken" hint={secrets.meta ? `Saved (${lastChars(secrets.meta)}). Leave empty to keep it.` : "Events Manager → your pixel → Settings → Conversions API → Generate access token."}><input id="metaToken" name="metaToken" type="password" autoComplete="off" className="field" dir="ltr" placeholder={secrets.meta ? "••••••••••" : "EAAB…"} /></Field>
              {secrets.meta && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="clearMeta" value="1" className="accent-[var(--brand)]" />Remove the saved token</label>}
              <Field label="Test event code (optional)" htmlFor="metaTestCode" hint="From Events Manager → Test events. Remove it when you go live."><input id="metaTestCode" name="metaTestCode" defaultValue={a.capi.metaTestCode} maxLength={40} className="field" dir="ltr" placeholder="TEST12345" /></Field>
            </div>
            <div className="space-y-3 rounded-2xl border border-line p-4">
              <h3 className="display font-extrabold">TikTok</h3>
              <Field label="Events API access token" htmlFor="tiktokToken" hint={secrets.tiktok ? `Saved (${lastChars(secrets.tiktok)}). Leave empty to keep it.` : "TikTok Events Manager → your pixel → Settings → Generate access token."}><input id="tiktokToken" name="tiktokToken" type="password" autoComplete="off" className="field" dir="ltr" placeholder={secrets.tiktok ? "••••••••••" : "token"} /></Field>
              {secrets.tiktok && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="clearTiktok" value="1" className="accent-[var(--brand)]" />Remove the saved token</label>}
              <Field label="Test event code (optional)" htmlFor="tiktokTestCode" hint="From the Test Events tab. Remove it when you go live."><input id="tiktokTestCode" name="tiktokTestCode" defaultValue={a.capi.tiktokTestCode} maxLength={40} className="field" dir="ltr" placeholder="TEST12345" /></Field>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3"><input type="checkbox" name="statusEvents" value="1" defaultChecked={a.capi.statusEvents} className="mt-1 size-4 accent-[var(--brand)]" /><span><span className="block font-bold">Also send order-status events</span><span className="text-xs text-muted">OrderConfirmed, OrderDelivered and OrderReturned as custom events, so you can build audiences (e.g. exclude returners) and see your real delivery rate in Ads Manager.</span></span></label>
        </Panel>
      </AdminForm>
      <Panel title="Server events" actions={<div className="flex gap-2">
        {a.metaPixel && secrets.meta && <ActionButton action={sendTestEventAction} fields={{ platform: "meta" }}>Test Meta</ActionButton>}
        {a.tiktokPixel && secrets.tiktok && <ActionButton action={sendTestEventAction} fields={{ platform: "tiktok" }}>Test TikTok</ActionButton>}
        {failed > 0 && <ActionButton action={retryEventsAction} className="btn btn-outline btn-sm">Retry {failed} failed</ActionButton>}
      </div>}>
        {log.results.length === 0 ? <p className="text-sm text-muted">Nothing sent yet. Add a token above, press <b>Test</b>, then place an order.</p> : (
          <DataTable minWidth="44rem" head={["When", "Platform", "Event", "Order", "Result"]}>
            {log.results.map((r, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap text-muted">{new Date(r.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="capitalize">{r.platform}</td><td className="font-semibold">{r.event}</td><td className="num">{r.number ? `#${r.number}` : <span className="text-muted">test</span>}</td>
                <td><span className={`font-bold ${r.status === "error" ? "text-danger" : "text-ok"}`}>{r.status === "error" ? `Failed${r.http ? ` (${r.http})` : ""}` : r.status === "test" ? "Test sent" : "Sent"}</span>{r.status === "error" && r.response && <span className="block max-w-xs truncate text-xs text-muted" title={r.response}>{r.response}</span>}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}

export function StatusesSection({ s }: { s: Settings }) {
  return (
    <AdminForm action={saveStatuses} submitLabel="Save order statuses">
      <p className="text-sm text-muted">Override the label and color of each order status. Leave a label empty to keep the default.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {ORDER_STATUSES.map((st) => {
          const def = DEFAULT_STATUS_DEFS[st], ov = s.statuses[st];
          return (
            <div key={st} className="card space-y-3 p-4">
              <div className="flex items-center justify-between gap-2"><code className="text-xs font-bold text-muted">{st}</code>
                <label className="flex items-center gap-2 text-xs font-semibold">Color <input type="color" name={`st.${st}.color`} defaultValue={ov?.color ?? def.color} aria-label={`${st} color`} className="size-9 cursor-pointer rounded border border-line bg-transparent p-0.5" /></label></div>
              {allLangs().map((l) => (
                <div key={l} className="flex items-center gap-2"><span className="w-7 text-center text-[11px] font-extrabold uppercase text-muted">{l}</span>
                  <input name={`st.${st}.label.${l}`} defaultValue={(ov?.label as Record<string, string> | undefined)?.[l] ?? (def.label as Record<string, string>)[l] ?? ""} dir={allLangMetas().find((m) => m.code === l)?.dir ?? "ltr"} maxLength={60} className="field" aria-label={`${st} label (${l})`} /></div>
              ))}
            </div>
          );
        })}
      </div>
    </AdminForm>
  );
}

const TPL: [keyof Settings["templates"], string][] = [["confirm", "Order confirmation"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["followup", "Abandoned-cart follow-up"]];
export function TemplatesSection({ s }: { s: Settings }) {
  return (
    <AdminForm action={saveTemplates} submitLabel="Save message templates">
      <p className="text-sm text-muted">WhatsApp messages. Placeholders: <code>{"{name}"}</code> <code>{"{store}"}</code> <code>{"{order}"}</code> <code>{"{total}"}</code> <code>{"{tracking}"}</code></p>
      {TPL.map(([k, label]) => <Panel key={k} title={label}><I18nField label={label} name={k} value={s.templates[k]} textarea rows={3} /></Panel>)}
    </AdminForm>
  );
}

export function EngageSection({ s }: { s: Settings }) {
  const e = s.engage;
  return (
    <AdminForm action={saveEngage} submitLabel="Save">
      <Panel title="App & notifications">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle name="pwa" label="Installable app (PWA)" hint="Home-screen install, offline page, faster repeat visits on weak connections." defaultChecked={e.pwa} />
          <Toggle name="push" label="Push notifications" hint="Ask visitors for permission and let you send them messages from Push notifications." defaultChecked={e.push} />
          <Toggle name="visitors" label="Visitor registry" hint="After the visitor accepts the privacy notice: country, city, device and a device fingerprint. Used to spot repeat fake orders and to target push messages." defaultChecked={e.visitors} />
        </div>
        <div className="mt-3"><Toggle name="langUrls" label="Language URLs for search engines" hint="Each language gets its own address (/ar, /fr, /en), hreflang tags and its own sitemap, so Google shows the right language to the right person." defaultChecked={e.langUrls} /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Ask for notifications after (seconds)" htmlFor="pds" hint="5–600. Never shown on the cart or checkout."><input id="pds" name="pushDelaySec" type="number" min={5} max={600} defaultValue={e.pushDelaySec} className="field num" /></Field>
          <Field label="Push contact (VAPID subject)" htmlFor="vs" hint="mailto:you@example.com — the push services may use it to reach you. Empty = the store email."><input id="vs" name="vapidSubject" defaultValue={e.vapidSubject} maxLength={200} dir="ltr" className="field" placeholder="mailto:hello@yourstore.com" /></Field>
        </div>
        <p className="mt-4 rounded-xl bg-sunken p-3 text-xs leading-relaxed text-muted">Collecting IP, location and device data is personal-data processing (Morocco law 09-08, GDPR). Visitors see a notice and nothing is recorded until they accept; keep your privacy page up to date.</p>
      </Panel>
    </AdminForm>
  );
}
