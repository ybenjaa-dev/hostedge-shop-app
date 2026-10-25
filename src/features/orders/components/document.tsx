import { formatMoney } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import type { Settings } from "@/lib/settings";
import { fileUrl } from "@/lib/storage";

type Item = { name: string; variant_name: string | null; sku: string | null; price: number; qty: number };
export type DocOrder = Record<string, string | number | null>;

/** Printable invoice or packing slip (A4). Slip hides prices except the COD amount to collect. */
export function OrderDocument({ o, items, s, kind }: { o: DocOrder; items: Item[]; s: Settings; kind: "invoice" | "slip" }) {
  const cur = o.currency as string;
  const f = (n: number) => formatMoney(n, cur, "en");
  const logo = fileUrl(s.branding.logo);
  return (
    <section className="sheet mx-auto my-6 max-w-[210mm] border border-gray-200 bg-white p-8 text-sm shadow print:my-0 print:max-w-none">
      <header className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={s.store.name} className="mb-1 h-10 w-auto" /> : <p className="text-2xl font-extrabold">{s.store.name}</p>}
          <p className="text-xs text-gray-600">{[s.store.email, s.store.phones[0] && `+${s.store.phones[0].replace(/\D/g, "")}`, tr(s.store.address, "en")].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-end"><p className="text-xl font-extrabold uppercase">{kind === "invoice" ? "Invoice" : "Packing slip"}</p><p className="num font-bold">#{o.number}</p><p className="text-xs text-gray-600">{new Date(o.created_at as number).toLocaleDateString("en-GB")}</p></div>
      </header>
      <div className="mt-5 grid grid-cols-2 gap-6">
        <div><p className="text-xs font-bold uppercase text-gray-500">Ship to</p><p className="font-bold">{o.name}</p><p>{o.address}</p><p>{o.city}, {o.country}</p><p dir="ltr" className="num text-start">+{o.phone}</p></div>
        <div className="text-end"><p className="text-xs font-bold uppercase text-gray-500">Payment</p><p className="font-bold">Cash on delivery</p>{o.carrier_id && <p className="capitalize">{o.carrier_id}</p>}{o.tracking_number && <p dir="ltr" className="num">{o.tracking_number}</p>}</div>
      </div>
      <table className="mt-6 w-full">
        <thead><tr className="border-b border-black text-xs uppercase"><th className="py-2 text-start">Item</th><th className="py-2 text-start">SKU</th><th className="py-2 text-end">Qty</th>{kind === "invoice" && <><th className="py-2 text-end">Price</th><th className="py-2 text-end">Total</th></>}</tr></thead>
        <tbody>{items.map((i, k) => <tr key={k} className="border-b border-gray-200"><td className="py-2">{tr(i.name, "en")}{i.variant_name && <span className="text-gray-600"> — {i.variant_name}</span>}</td><td className="py-2 text-gray-600">{i.sku}</td><td className="num py-2 text-end font-bold">{i.qty}</td>{kind === "invoice" && <><td className="num py-2 text-end">{f(i.price)}</td><td className="num py-2 text-end">{f(i.price * i.qty)}</td></>}</tr>)}</tbody>
      </table>
      {kind === "invoice" ? (
        <dl className="num ms-auto mt-4 w-64 space-y-1">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{f(o.subtotal as number)}</dd></div>
          {(o.discount as number) > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{f(o.discount as number)}</dd></div>}
          <div className="flex justify-between"><dt>Shipping</dt><dd>{f(o.shipping as number)}</dd></div>
          {(o.cod_fee as number) > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{f(o.cod_fee as number)}</dd></div>}
          {(o.tax as number) > 0 && <div className="flex justify-between"><dt>Tax</dt><dd>{f(o.tax as number)}</dd></div>}
          <div className="flex justify-between border-t-2 border-black pt-2 text-lg font-extrabold"><dt>Total</dt><dd>{f(o.total as number)}</dd></div>
        </dl>
      ) : (
        <div className="mt-6 rounded border-2 border-black p-4 text-center"><p className="text-xs font-bold uppercase">Cash to collect on delivery</p><p className="num text-3xl font-extrabold">{f(o.total as number)}</p></div>
      )}
      {o.notes && <p className="mt-4 rounded bg-gray-100 p-3">Customer note: {o.notes}</p>}
      <p className="mt-8 text-center text-xs text-gray-500">Thank you for your order — {s.store.name}</p>
    </section>
  );
}
