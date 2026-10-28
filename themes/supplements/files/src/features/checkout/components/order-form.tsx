"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Tag, Truck, Phone } from "lucide-react";
import { computeTotals, freeShippingRemaining, type BundleRule, type CouponRule } from "@/lib/pricing";
import { COUNTRIES, countryByCode, normalizePhone } from "@/lib/phone";
import { formatMoney } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import { placeOrder, saveAbandoned, validateCoupon } from "../actions";
import { useStore, useT, type CityOpt } from "../store-context";
import { CityCombobox } from "./city-combobox";
import { useToast } from "@/components/toast";
import { cart } from "../cart-store";
import { track, trackingContext } from "@/lib/track";

export type FormLine = { productId: string; variantId: string | null; name: string; variantName: string | null; unitPrice: number; qty: number; image: string | null };

/** Landing context for the abandoned-checkout record: referrer, utm_* params and click-id presence (ids themselves are not stored). */
function pageContext() {
  try {
    const q = new URLSearchParams(location.search);
    const utm: Record<string, string> = {};
    q.forEach((v, k) => { if (/^utm_[a-z]+$/.test(k) && Object.keys(utm).length < 8) utm[k] = v.slice(0, 120); });
    const clk = JSON.parse(localStorage.getItem("he_clk") ?? "{}") as { fbc?: string; ttclid?: string };
    return { url: location.href.slice(0, 500), referrer: document.referrer.slice(0, 500) || undefined, utm: Object.keys(utm).length ? utm : undefined, fbclid: q.has("fbclid") || !!clk.fbc, ttclid: q.has("ttclid") || !!clk.ttclid };
  } catch {
    return { url: location.href.slice(0, 500) };
  }
}

const newKey = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, "").slice(0, 32);

/**
 * The COD order form. Used on the product page (sheet / modal / inline), the dedicated checkout page
 * and the cart checkout. Totals are computed locally with the shared pricing engine for instant feedback
 * and re-computed authoritatively on the server when the order is placed.
 */
export function OrderForm({ lines, bundles, cities, header, source, clearCartOnSuccess, productName, initialCoupon }: {
  lines: FormLine[]; bundles: BundleRule[]; cities: CityOpt[]; header?: ReactNode; source: string; clearCartOnSuccess?: boolean; productName?: string; initialCoupon?: string;
}) {
  const st = useStore();
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const cur = st.currency;
  const fmt = (n: number) => formatMoney(n, cur, st.lang);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pc, setPc] = useState(st.country);
  const [cityId, setCityId] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [hp, setHp] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponRule | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const idemRef = useRef(newKey());
  const abandonId = useRef(newKey());
  const sig = JSON.stringify(lines.map((l) => [l.productId, l.variantId, l.qty]));
  const lastSig = useRef(sig);
  useEffect(() => { if (lastSig.current !== sig) { lastSig.current = sig; idemRef.current = newKey(); } }, [sig]);

  const city = cities.find((c) => c.id === cityId) ?? null;
  const phoneRes = useMemo(() => normalizePhone(phone, pc), [phone, pc]);

  const totals = useMemo(
    () =>
      computeTotals({
        lines: lines.map((l) => ({ productId: l.productId, unitPrice: l.unitPrice, qty: l.qty })),
        bundles,
        coupon,
        shippingFee: city?.fee ?? st.defaultShippingFee,
        freeShippingThreshold: city?.freeAbove ?? st.freeThreshold,
        codFee: st.codFee,
        taxRateBp: st.taxRateBp,
        taxInclusive: st.taxInclusive,
      }),
    [lines, bundles, coupon, city, st],
  );
  const threshold = city?.freeAbove ?? st.freeThreshold;
  const remaining = freeShippingRemaining(totals.subtotal - totals.discount, threshold);

  const errors = {
    name: name.trim().length < 2 ? t("cod.err.name") : "",
    phone: !phoneRes.ok ? t("cod.err.phone") : "",
    city: !cityId ? t("cod.err.city") : "",
    address: address.trim().length < 4 ? t("cod.err.address") : "",
  };
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : "");
  const touch = (k: string) => setTouched((x) => ({ ...x, [k]: true }));

  // Abandoned-order capture: once a valid phone is typed, remember it (debounced).
  useEffect(() => {
    if (!phoneRes.ok || status === "done") return;
    const h = setTimeout(() => {
      void saveAbandoned({
        id: abandonId.current, phone, phoneCountry: pc, name: name.trim() || undefined, city: city?.name, address: address.trim() || undefined, notes: notes.trim() || undefined,
        productId: lines[0]?.productId, productName,
        lines: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, variantName: l.variantName, qty: l.qty, unitPrice: l.unitPrice })),
        subtotal: totals.subtotal, total: totals.total, currency: cur, coupon: coupon?.code, lang: st.lang, page: pageContext(),
      });
    }, 1500);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, pc, name, cityId, address, notes, phoneRes.ok, status, city, lines, productName, coupon, totals.total]);

  useEffect(() => { track("InitiateCheckout", { value: totals.total, currency: cur, ids: lines.map((l) => l.productId) }); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => { if (initialCoupon) { setCouponInput(initialCoupon); void applyCoupon(initialCoupon); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function applyCoupon(override?: string) {
    const code = (override ?? couponInput).trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponMsg(null);
    const r = await validateCoupon(code);
    setCouponBusy(false);
    if (!r.ok) { setCoupon(null); setCouponMsg(r.reason === "expired" ? "Expired code" : r.reason === "exhausted" ? "Code fully used" : "Invalid code"); return; }
    setCoupon({ code: r.code, type: r.type, value: r.value, minSubtotal: r.minSubtotal });
    setCouponMsg(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "idle") return; // double-submit guard
    setTouched({ name: true, phone: true, city: true, address: true });
    if (Object.values(errors).some(Boolean)) {
      const first = (["name", "phone", "city", "address"] as const).find((k) => errors[k]);
      document.getElementById(`of-${first}`)?.focus();
      return;
    }
    if (city && !city.codAvailable) { setFormError(t("cod.err.codcity")); return; }
    setStatus("sending");
    setFormError(null);
    const res = await placeOrder({
      idemKey: idemRef.current,
      items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, qty: l.qty })),
      name, phone, phoneCountry: pc, cityId, address, notes: notes || undefined,
      couponCode: coupon?.code, hp, source, lang: st.lang, tracking: trackingContext(),
    });
    if (!res.ok) {
      setStatus("idle");
      const m: Record<string, string> = { blocked: "cod.err.blocked", rate_limit: "cod.err.rate", stock: "cod.err.stock", unavailable: "cod.err.unavailable", cod_unavailable: "cod.err.codcity", phone: "cod.err.phone" };
      const msg = t((m[res.code] ?? "cod.err.generic") as never);
      setFormError(msg);
      toast("error", msg);
      return;
    }
    setStatus("done");
    if (!res.duplicate) track(res.pixelEvent ?? "Purchase", { value: res.total, currency: res.currency, ids: res.items.map((i) => i.productId), eventId: res.number });
    if (clearCartOnSuccess) cart.clear();
    toast("success", res.duplicate ? t("cod.dupe", { n: res.number }) : t("cod.success"));
    router.push(res.duplicate ? `/order/${res.number}?t=${res.token}` : `/order/${res.number}/offer?t=${res.token}`);
  }

  const countryList = COUNTRIES.filter((c) => st.countries.includes(c.code));
  const dial = countryByCode(pc)?.dial;
  const sending = status !== "idle";

  return (
    <form onSubmit={submit} noValidate className="space-y-4" aria-busy={sending}>
      {header}
      {/* honeypot — hidden from humans & assistive tech. No label and a neutral name: a "Website" field gets auto-filled by browsers and password managers, which silently turned real orders into fake ones. */}
      <div aria-hidden="true" className="pointer-events-none absolute -start-[9999px] h-0 w-0 overflow-hidden opacity-0">
        <input type="text" tabIndex={-1} autoComplete="off" data-lpignore="true" data-1p-ignore="true" data-form-type="other" inputMode="none" value={hp} onChange={(e) => setHp(e.target.value)} name="zq_ref_41" aria-label="Leave this field empty" />
      </div>

      <div>
        <label className="label" htmlFor="of-name">{t("cod.fullName")}</label>
        <input id="of-name" name="name" autoFocus autoComplete="name" enterKeyHint="next" className="field" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch("name")} aria-invalid={!!show("name")} aria-describedby="of-name-e" />
        {show("name") && <p id="of-name-e" className="err">{show("name")}</p>}
      </div>

      <div>
        <label className="label" htmlFor="of-phone">{t("cod.phone")}</label>
        <div className="flex gap-2" dir="ltr">
          {countryList.length > 1 ? (
            <select aria-label="Country code" className="field !w-28 shrink-0 !px-2" value={pc} onChange={(e) => setPc(e.target.value)}>
              {countryList.map((c) => <option key={c.code} value={c.code}>{c.flag} +{c.dial}</option>)}
            </select>
          ) : (
            <span className="field !flex !w-24 shrink-0 items-center justify-center bg-sunken !px-2 font-semibold">{countryByCode(pc)?.flag} +{dial}</span>
          )}
          <input id="of-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel-national" enterKeyHint="next" className="field" placeholder="6 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => touch("phone")} aria-invalid={!!show("phone")} aria-describedby="of-phone-e" />
        </div>
        {show("phone") && <p id="of-phone-e" className="err">{show("phone")}</p>}
      </div>

      <div id="of-city">
        <CityCombobox cities={cities} value={cityId} onChange={(id) => { setCityId(id); touch("city"); }} lang={st.lang} placeholder={t("cod.cityPh")} label={t("cod.city")} invalid={!!show("city")} errorId="of-city-e" disabledNote="COD ✕" />
        {show("city") && <p id="of-city-e" className="err">{show("city")}</p>}
        {city && !city.codAvailable && <p className="err">{t("cod.noCod")}</p>}
      </div>

      <div>
        <label className="label" htmlFor="of-address">{t("cod.address")}</label>
        <textarea id="of-address" name="address" rows={2} autoComplete="street-address" enterKeyHint="next" className="field resize-none" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => touch("address")} aria-invalid={!!show("address")} aria-describedby="of-address-e" />
        {show("address") && <p id="of-address-e" className="err">{show("address")}</p>}
      </div>

      <div>
        <label className="label" htmlFor="of-notes">{t("cod.notes")}</label>
        <input id="of-notes" name="notes" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} enterKeyHint="done" />
      </div>

      {/* free-shipping progress */}
      {threshold > 0 && (
        <div className="rounded-2xl bg-mint p-3 text-sm" role="status">
          <p className="mb-2 flex items-center gap-2 font-semibold"><Truck className="size-4 text-brand" aria-hidden />{remaining > 0 ? t("cod.freeShipHint", { amount: fmt(remaining) }) : t("cod.freeShipOk")}</p>
          <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.round(((totals.subtotal - totals.discount) / threshold) * 100))}%` }} /></div>
        </div>
      )}

      {/* coupon */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input aria-label={t("cod.coupon")} placeholder={t("cod.coupon")} className="field ps-9 uppercase" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyCoupon(); } }} />
        </div>
        <button type="button" className="btn btn-outline" onClick={() => applyCoupon()} disabled={couponBusy || !couponInput.trim()}>{couponBusy ? <Loader2 className="size-4 animate-spin" /> : t("cod.applyCoupon")}</button>
      </div>
      {couponMsg && <p className="err" role="alert">{couponMsg}</p>}
      {coupon && !totals.couponError && <p className="flex items-center gap-1 text-sm font-semibold text-ok"><Check className="size-4" />{coupon.code}</p>}
      {totals.couponError && <p className="err">Min. {fmt(coupon!.minSubtotal)}</p>}

      {/* totals */}
      <dl className="num space-y-1.5 rounded-2xl bg-mint p-4 text-sm">
        {lines.length > 1 && lines.map((l, i) => (
          <div key={i} className="flex justify-between gap-3 text-muted"><dt className="min-w-0 truncate">{l.qty}× {tr(l.name, st.lang)}{l.variantName ? ` · ${l.variantName}` : ""}</dt><dd dir="ltr">{fmt(l.unitPrice * l.qty)}</dd></div>
        ))}
        <Row k={t("cod.subtotal")} v={fmt(totals.subtotal)} />
        {totals.discount > 0 && <Row k={t("cod.discount")} v={`−${fmt(totals.discount)}`} className="text-ok" />}
        <Row k={t("cod.shipping")} v={totals.shipping === 0 ? t("cod.free") : fmt(totals.shipping)} />
        {totals.codFee > 0 && <Row k={t("cod.codFee")} v={fmt(totals.codFee)} />}
        {st.taxRateBp > 0 && !st.taxInclusive && <Row k={t("cod.tax")} v={fmt(totals.tax)} />}
        <div className="flex items-baseline justify-between border-t border-line pt-2.5 text-base font-extrabold"><dt className="min-w-0">{t("cod.total")}</dt><dd dir="ltr" className="shrink-0 whitespace-nowrap text-xl text-brand">{fmt(totals.total)}</dd></div>
      </dl>

      {formError && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">{formError}</p>}

      <button type="submit" className="btn btn-primary btn-lg w-full" disabled={sending || (city ? !city.codAvailable : false)}>
        {sending ? <><span className="spinner" aria-hidden /> {t("cod.sending")}</> : <><Check className="size-5" aria-hidden /> {t("cod.confirm")}</>}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted"><Phone className="size-3.5" aria-hidden />{t("done.pending")}</p>
    </form>
  );
}

function Row({ k, v, className = "" }: { k: string; v: string; className?: string }) {
  return <div className={`flex justify-between gap-3 ${className}`}><dt>{k}</dt><dd dir="ltr">{v}</dd></div>;
}
