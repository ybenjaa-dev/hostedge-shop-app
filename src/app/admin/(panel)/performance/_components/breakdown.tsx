import type { Breakdown } from "@/features/performance/queries";
import { barWidth, formatPct, safeRate } from "@/features/performance/math";
import { formatMoney } from "@/lib/money";

const rateCls = (r: number | null, bad: boolean) => (r == null ? "text-muted" : bad ? (r >= 0.25 ? "text-danger font-bold" : r >= 0.15 ? "font-semibold" : "") : r >= 0.8 ? "text-ok font-bold" : "");

/** Compact ranked table with an inline bar for volume. Delivery = delivered ÷ shipped, Returns = failed/returned ÷ shipped. */
export function BreakdownTable({ caption, rows, nameHead, currency, showMoney, minShipped = 5 }: { caption: string; rows: (Breakdown & { qty?: number })[]; nameHead: string; currency: string; showMoney: boolean; minShipped?: number }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Nothing to show in this range.</p>;
  const max = Math.max(...rows.map((r) => r.orders));
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[22rem] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead><tr className="text-xs text-muted">
          <th scope="col" className="pb-2 text-start font-semibold">{nameHead}</th>
          <th scope="col" className="pb-2 text-end font-semibold">Orders</th>
          <th scope="col" className="pb-2 ps-3 text-end font-semibold">Delivered</th>
          <th scope="col" className="pb-2 ps-3 text-end font-semibold">Returns</th>
          {showMoney && <th scope="col" className="pb-2 ps-3 text-end font-semibold">Delivered revenue</th>}
        </tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => {
            const d = r.shipped >= minShipped ? safeRate(r.delivered, r.shipped) : null, f = r.shipped >= minShipped ? safeRate(r.failed, r.shipped) : null;
            return (
              <tr key={r.key || r.label}>
                <td className="max-w-[14rem] py-2 pe-2"><div className="truncate font-semibold" title={r.label}>{r.label}</div><div className="mt-1 h-1 rounded-full bg-sunken" aria-hidden><div className="h-full rounded-full bg-brand" style={{ width: `${barWidth(r.orders, max)}%` }} /></div></td>
                <td className="num py-2 text-end font-bold">{r.orders}</td>
                <td className={`num py-2 ps-3 text-end ${rateCls(d, false)}`} title={r.shipped < minShipped ? `Needs ${minShipped}+ shipped orders (${r.shipped} so far)` : `${r.delivered} of ${r.shipped} shipped`}>{formatPct(d)}</td>
                <td className={`num py-2 ps-3 text-end ${rateCls(f, true)}`} title={r.shipped < minShipped ? `Needs ${minShipped}+ shipped orders (${r.shipped} so far)` : `${r.failed} of ${r.shipped} shipped`}>{formatPct(f)}</td>
                {showMoney && <td dir="ltr" className="num py-2 ps-3 text-end">{formatMoney(r.revenue, currency, "en")}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
