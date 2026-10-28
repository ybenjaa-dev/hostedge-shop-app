import type { Bucket } from "@/features/performance/math";
import { barWidth, formatPct, safeRate } from "@/features/performance/math";

const W = 640, H = 190, PAD_L = 34, PAD_R = 10, PAD_T = 10, PAD_B = 26;
const niceMax = (v: number) => Math.max(4, Math.ceil(v / 4) * 4);
const short = (label: string, weekly: boolean) => (weekly ? `Wk ${label.slice(5)}` : label.slice(5));

function Legend({ items }: { items: { color: string; label: string; shape?: "box" | "line" }[] }) {
  return <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">{items.map((i) => <li key={i.label} className="inline-flex items-center gap-1.5"><span aria-hidden className={i.shape === "line" ? "h-0.5 w-4 rounded" : "size-2.5 rounded-sm"} style={{ background: i.color }} />{i.label}</li>)}</ul>;
}
function DataTableFallback({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="sr-only"><caption>{caption}</caption>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
    </table>
  );
}

/** Orders per bucket (bars) with the confirmed share overlaid and a delivered line. */
export function OrdersTrend({ data, weekly }: { data: Bucket[]; weekly: boolean }) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.orders)));
  const iw = W - PAD_L - PAD_R, ih = H - PAD_T - PAD_B, bw = iw / Math.max(1, data.length);
  const y = (v: number) => PAD_T + ih - (v / max) * ih;
  const step = Math.ceil(data.length / 8);
  const line = data.map((d, i) => `${i ? "L" : "M"}${(PAD_L + i * bw + bw / 2).toFixed(1)},${y(d.delivered).toFixed(1)}`).join(" ");
  const total = data.reduce((s, d) => s + d.orders, 0);
  return (
    <figure>
      <Legend items={[{ color: "var(--brand)", label: "Orders placed" }, { color: "var(--accent)", label: "Confirmed" }, { color: "var(--ok)", label: "Delivered", shape: "line" }]} />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Orders per ${weekly ? "week" : "day"}: ${total} in total, with confirmed and delivered counts. Full data in the table below the chart.`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => <g key={f}><line x1={PAD_L} x2={W - PAD_R} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" strokeDasharray={f ? "3 4" : undefined} /><text x={PAD_L - 6} y={y(max * f) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">{Math.round(max * f)}</text></g>)}
        {data.map((d, i) => {
          const x = PAD_L + i * bw;
          return (
            <g key={d.day}>
              <rect x={x + bw * 0.12} y={y(d.orders)} width={bw * 0.76} height={Math.max(d.orders ? 2 : 0, PAD_T + ih - y(d.orders))} rx={Math.min(3, bw * 0.15)} fill="var(--brand)" opacity=".28" />
              <rect x={x + bw * 0.28} y={y(d.confirmed)} width={bw * 0.44} height={Math.max(d.confirmed ? 2 : 0, PAD_T + ih - y(d.confirmed))} rx={Math.min(2, bw * 0.1)} fill="var(--accent)" />
              <rect x={x} y={PAD_T} width={bw} height={ih} fill="transparent"><title>{`${weekly ? "Week of " : ""}${d.label}: ${d.orders} orders, ${d.confirmed} confirmed, ${d.delivered} delivered`}</title></rect>
              {i % step === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">{short(d.label, weekly)}</text>}
            </g>
          );
        })}
        <path d={line} fill="none" stroke="var(--ok)" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <DataTableFallback caption={`Orders per ${weekly ? "week" : "day"}`} head={[weekly ? "Week of" : "Day", "Orders", "Confirmed", "Delivered"]} rows={data.map((d) => [d.label, d.orders, d.confirmed, d.delivered])} />
    </figure>
  );
}

/** Confirmation rate (confirmed ÷ handled) per bucket as a line; gaps where nothing was handled. */
export function RateTrend({ data, weekly }: { data: Bucket[]; weekly: boolean }) {
  const iw = W - PAD_L - PAD_R, ih = H - PAD_T - PAD_B;
  const x = (i: number) => PAD_L + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (r: number) => PAD_T + ih - r * ih;
  const step = Math.ceil(data.length / 8);
  let d = "", pen = false;
  data.forEach((b, i) => { if (b.rate == null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(b.rate).toFixed(1)} `; pen = true; });
  return (
    <figure>
      <Legend items={[{ color: "var(--brand)", label: "Confirmation rate", shape: "line" }]} />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Confirmation rate per ${weekly ? "week" : "day"}. Full data in the table below the chart.`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => <g key={f}><line x1={PAD_L} x2={W - PAD_R} y1={y(f)} y2={y(f)} stroke="var(--line)" strokeDasharray={f ? "3 4" : undefined} /><text x={PAD_L - 6} y={y(f) + 3} textAnchor="end" fontSize="10" fill="var(--muted)">{Math.round(f * 100)}%</text></g>)}
        <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((b, i) => (
          <g key={b.day}>
            {b.rate != null && <circle cx={x(i)} cy={y(b.rate)} r={data.length > 40 ? 2 : 3.5} fill="var(--surface)" stroke="var(--brand)" strokeWidth="2"><title>{`${weekly ? "Week of " : ""}${b.label}: ${formatPct(b.rate)} (${b.confirmed} of ${b.handled} handled)`}</title></circle>}
            {i % step === 0 && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">{short(b.label, weekly)}</text>}
          </g>
        ))}
      </svg>
      <DataTableFallback caption={`Confirmation rate per ${weekly ? "week" : "day"}`} head={[weekly ? "Week of" : "Day", "Handled", "Confirmed", "Rate"]} rows={data.map((b) => [b.label, b.handled, b.confirmed, formatPct(b.rate, 1)])} />
    </figure>
  );
}

export type FunnelStep = { label: string; value: number };
/** New → Confirmed → Shipped → Delivered with step conversion and drop-off. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value ?? 0;
  return (
    <ol className="space-y-3" aria-label="Conversion funnel">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1]!.value : null;
        const step = prev == null ? null : safeRate(s.value, prev);
        return (
          <li key={s.label}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-semibold">{s.label}</span>
              <span className="num text-muted"><b className="text-ink">{s.value}</b>{top > 0 && <> · {formatPct(safeRate(s.value, top))} of new</>}</span>
            </div>
            <div className="h-5 rounded-md bg-sunken" role="img" aria-label={`${s.label}: ${s.value}`}>
              <div className="h-full rounded-md bg-brand transition-[width]" style={{ width: `${barWidth(s.value, top)}%`, opacity: 1 - i * 0.18, minWidth: s.value ? 4 : 0 }} />
            </div>
            {prev != null && <p className="mt-1 text-xs text-muted num">{formatPct(step)} continue from the previous step{prev - s.value > 0 && <> · <span className="text-danger">{prev - s.value} dropped off</span></>}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export type OutcomePart = { label: string; value: number; color: string };
/** Stacked bar of where the range's orders ended up. Labels carry the numbers so colour is never the only cue. */
export function OutcomeBar({ parts }: { parts: OutcomePart[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-6 overflow-hidden rounded-md bg-sunken" role="img" aria-label={`Outcomes: ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
        {parts.filter((p) => p.value > 0).map((p) => <div key={p.label} title={`${p.label}: ${p.value} (${formatPct(safeRate(p.value, total))})`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} className="border-e border-surface last:border-e-0" />)}
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {parts.map((p) => <li key={p.label} className="flex items-center gap-2"><span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: p.color }} /><span className="text-muted">{p.label}</span><span className="num ms-auto font-bold">{p.value}<span className="font-normal text-muted"> · {formatPct(safeRate(p.value, total))}</span></span></li>)}
      </ul>
    </div>
  );
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Weekday × hour grid of order creation (UTC), shaded by volume. */
export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const order = [1, 2, 3, 4, 5, 6, 0];
  const best = grid.flatMap((r, d) => r.map((n, h) => ({ d, h, n }))).sort((a, b) => b.n - a.n)[0];
  return (
    <div>
      <div className="overflow-x-auto" tabIndex={0} role="group" aria-label="Orders by weekday and hour (UTC); a table with the same numbers follows">
        <div className="grid min-w-[34rem] gap-px text-[10px]" style={{ gridTemplateColumns: "2.2rem repeat(24, minmax(0, 1fr))" }}>
          <span />
          {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center text-muted">{h % 3 === 0 ? h : ""}</span>)}
          {order.map((d) => (
            <div key={d} className="contents">
              <span className="self-center pe-1 text-end text-muted">{DOW[d]}</span>
              {grid[d]!.map((n, h) => <span key={h} title={`${DOW[d]} ${String(h).padStart(2, "0")}:00 UTC — ${n} orders`} className="aspect-square rounded-[3px]" style={{ background: n ? `color-mix(in srgb, var(--brand) ${Math.round(15 + (n / max) * 85)}%, var(--surface))` : "var(--sunken)" }} />)}
            </div>
          ))}
        </div>
      </div>
      {best && best.n > 0 && <p className="mt-3 text-xs text-muted">Busiest slot: <b className="text-ink">{DOW[best.d]} around {String(best.h).padStart(2, "0")}:00</b> ({best.n} orders). Times are UTC.</p>}
      <DataTableFallback caption="Orders by weekday (UTC)" head={["Weekday", "Orders"]} rows={order.map((d) => [DOW[d]!, grid[d]!.reduce((s, n) => s + n, 0)])} />
    </div>
  );
}
