"use client";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight, Flag } from "lucide-react";
import { agentFlags, compareBy, formatDuration, formatPct, rankAgents, teamAverages, type SortDir } from "@/features/performance/math";
import { formatMoney } from "@/lib/money";

export type Row = {
  userId: string; name: string; roleLabel: string; roleColor: string; active: boolean;
  handled: number; confirmed: number; cancelled: number; noAnswer: number; postponed: number; shipped: number;
  confirmRate: number | null; avgResponseMin: number | null; delivered: number; failed: number; deliveredRate: number | null; cashDelivered: number; perDay: number;
  recent: { orderId: string; number: string; from: string | null; to: string; label: string; at: string }[];
};
type Key = "name" | "handled" | "confirmed" | "confirmRate" | "avgResponseMin" | "perDay" | "deliveredRate" | "cashDelivered";
const COLS: { key: Key; label: string; money?: boolean }[] = [
  { key: "handled", label: "Handled" }, { key: "confirmed", label: "Confirmed" }, { key: "confirmRate", label: "Confirm rate" },
  { key: "avgResponseMin", label: "First reply" }, { key: "perDay", label: "Per day" }, { key: "deliveredRate", label: "Confirmation quality" }, { key: "cashDelivered", label: "Cash delivered", money: true },
];

/** Sortable team table. Click a name to open their last 20 actions in range. */
export function TeamTable({ rows, currency, showMoney }: { rows: Row[]; currency: string; showMoney: boolean }) {
  const [sort, setSort] = useState<{ key: Key; dir: SortDir }>({ key: "handled", dir: "desc" });
  const [open, setOpen] = useState<string | null>(null);
  const avg = useMemo(() => teamAverages(rows), [rows]);
  const rank = useMemo(() => rankAgents(rows), [rows]);
  const sorted = useMemo(() => [...rows].sort(compareBy((r) => (sort.key === "name" ? r.name : r[sort.key]), sort.dir)), [rows, sort]);
  const cols = COLS.filter((c) => showMoney || !c.money);
  const toggle = (key: Key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "avgResponseMin" ? "asc" : "desc" }));
  const ariaSort = (key: Key) => (sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none");
  return (
    <div className="dt-card">
      <div className="dt-scroll">
        <table className="dt" style={{ minWidth: "56rem" }}>
          <caption className="sr-only">Team performance by teammate. Sortable columns.</caption>
          <thead><tr>
            <th scope="col" aria-sort={ariaSort("name")}><button type="button" className="inline-flex items-center gap-1 font-[inherit] uppercase hover:text-ink" onClick={() => toggle("name")}>Teammate {sort.key === "name" && (sort.dir === "asc" ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}</button></th>
            {cols.map((c) => (
              <th key={c.key} scope="col" className="is-end" aria-sort={ariaSort(c.key)}>
                <button type="button" className="ms-auto inline-flex items-center gap-1 font-[inherit] uppercase hover:text-ink" onClick={() => toggle(c.key)}>{c.label}{sort.key === c.key && (sort.dir === "asc" ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}</button>
              </th>
            ))}
          </tr></thead>
          <tbody>
            {sorted.map((a) => {
              const flags = agentFlags(a, avg), r = rank.get(a.userId), isOpen = open === a.userId;
              return (
                <Fragment key={a.userId}>
                  <tr className={a.active ? "" : "opacity-60"}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-extrabold ${r === 1 ? "bg-accent text-accent-ink" : r && r <= 3 ? "bg-brand-soft text-brand" : "bg-sunken text-muted"}`} title={r ? `Rank ${r} by confirmation rate` : "Needs 5+ handled orders to be ranked"} aria-label={r ? `Rank ${r}` : "Not ranked"}>{r ?? "–"}</span>
                        <div className="min-w-0">
                          <button type="button" className="inline-flex items-center gap-1 text-start font-semibold hover:text-brand" aria-expanded={isOpen} aria-controls={`act-${a.userId}`} onClick={() => setOpen(isOpen ? null : a.userId)}>
                            <ChevronRight className={`size-3.5 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} aria-hidden />{a.name}
                          </button>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px]" style={{ color: a.roleColor }}>{a.roleLabel}{!a.active && <span className="text-muted">· inactive</span>}</div>
                        </div>
                        {flags.map((f) => <span key={f.key} title={f.label} className="inline-flex shrink-0 items-center text-accent" tabIndex={0} role="img" aria-label={f.label}><Flag className="size-3.5" aria-hidden /></span>)}
                      </div>
                    </td>
                    <td className="num is-end font-semibold">{a.handled}<span className="block text-[11px] font-normal text-muted">{a.shipped} shipped</span></td>
                    <td className="is-end"><span className="num font-semibold text-ok">{a.confirmed}</span><span className="block text-[11px] text-muted">{a.cancelled} cancelled · {a.noAnswer} no answer{a.postponed > 0 && ` · ${a.postponed} postponed`}</span></td>
                    <td className="is-end"><span className="num font-bold">{formatPct(a.confirmRate)}</span><span className="ms-auto mt-1 block h-1.5 w-20 overflow-hidden rounded-full bg-sunken" aria-hidden><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round((a.confirmRate ?? 0) * 100)}%` }} /></span></td>
                    <td className="num is-end">{formatDuration(a.avgResponseMin)}</td>
                    <td className="num is-end">{a.perDay >= 10 ? Math.round(a.perDay) : a.perDay.toFixed(1)}</td>
                    <td className="is-end"><span className="num font-bold">{formatPct(a.deliveredRate)}</span><span className="block text-[11px] text-muted">{a.delivered} delivered · {a.failed} failed</span></td>
                    {showMoney && <td dir="ltr" className="num is-end">{formatMoney(a.cashDelivered, currency, "en")}</td>}
                  </tr>
                  {isOpen && (
                    <tr id={`act-${a.userId}`}><td colSpan={cols.length + 1} className="bg-sunken/60">
                      {flags.length > 0 && <ul className="mb-2 space-y-0.5 text-xs text-muted">{flags.map((f) => <li key={f.key} className="flex items-start gap-1.5"><Flag className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden />{f.label}</li>)}</ul>}
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">Last {a.recent.length} actions in range</p>
                      {a.recent.length === 0 ? <p className="text-sm text-muted">No actions.</p> : (
                        <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{a.recent.map((x, i) => <li key={i} className="flex flex-wrap items-baseline gap-x-2"><Link href={`/admin/orders/${x.orderId}`} className="num font-bold text-brand hover:underline">#{x.number}</Link><span>{x.label}</span><span className="num ms-auto text-xs text-muted">{x.at}</span></li>)}</ul>
                      )}
                    </td></tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
