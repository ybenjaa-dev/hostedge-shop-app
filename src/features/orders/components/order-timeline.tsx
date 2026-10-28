import { Ban, Banknote, Check, CheckCheck, Clock, Hourglass, PackageCheck, PackageOpen, PhoneMissed, RotateCcw, Sparkles, Truck, Undo2, User, XCircle, type LucideIcon } from "lucide-react";
import type { Settings } from "@/lib/settings";
import { statusInfo } from "@/lib/status-labels";

type H = { id: string; from_status: string | null; to_status: string; user_name: string | null; note: string | null; created_at: number };

const ICON: Record<string, LucideIcon> = {
  new: Sparkles, pending_confirmation: Hourglass, confirmed: Check, no_answer: PhoneMissed, postponed: Clock, cancelled: Ban, ready_to_ship: PackageOpen, shipped: Truck,
  out_for_delivery: Truck, delivered: PackageCheck, delivery_failed: XCircle, returned: Undo2, return_received: RotateCcw, refunded: Banknote,
};
/** The happy path, shown as a progress tracker above the event feed. */
const STEPS = ["new", "confirmed", "shipped", "delivered"] as const;
const STEP_OF: Record<string, number> = { new: 0, pending_confirmation: 0, no_answer: 0, postponed: 0, confirmed: 1, ready_to_ship: 1, shipped: 2, out_for_delivery: 2, delivered: 3 };

const rel = (ms: number) => { const m = Math.max(0, Math.round(ms / 60000)); if (m < 1) return "just now"; if (m < 60) return `${m} min`; if (m < 1440) return `${Math.round(m / 60)} h`; return `${Math.round(m / 1440)} d`; };
const when = (t: number) => new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Progress tracker + event feed (newest first) with who did it, how long each step took and the notes. */
export function OrderTimeline({ history, current, s }: { history: H[]; current: string; s: Pick<Settings, "statuses"> }) {
  const reached = Math.max(-1, ...history.map((h) => STEP_OF[h.to_status] ?? -1));
  const bad = ["cancelled", "delivery_failed", "returned", "return_received", "refunded"].includes(current);
  const cur = statusInfo(s, current, "en");
  const asc = [...history].sort((a, b) => a.created_at - b.created_at);
  const gap = new Map(asc.map((h, i) => [h.id, i > 0 ? h.created_at - asc[i - 1]!.created_at : 0]));
  return (
    <div>
      <ol className="mb-6 grid grid-cols-4 gap-1" aria-label="Order progress">
        {STEPS.map((k, i) => {
          const done = i <= reached;
          const isNow = i === (STEP_OF[current] ?? -1) && !bad;
          const I = ICON[k] ?? Check;
          return (
            <li key={k} className="relative flex flex-col items-center text-center">
              {i > 0 && <span aria-hidden className={`absolute end-1/2 top-[1.15rem] h-0.5 w-full ${i <= reached ? "bg-brand" : "bg-line"}`} />}
              <span className={`relative z-10 grid size-9 place-items-center rounded-full border-2 transition ${done ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-muted"} ${isNow ? "ring-4 ring-brand/20" : ""}`}><I className="size-4" aria-hidden /></span>
              <span className={`mt-1.5 text-[11px] font-bold leading-tight ${done ? "text-ink" : "text-muted"}`}>{statusInfo(s, k, "en").label}</span>
            </li>
          );
        })}
      </ol>
      {bad && <p className="mb-5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold" style={{ background: `color-mix(in srgb, ${cur.color} 12%, transparent)`, color: cur.color }}>{(() => { const I = ICON[current] ?? Ban; return <I className="size-4" aria-hidden />; })()}This order is {cur.label.toLowerCase()}.</p>}

      <ol className="relative space-y-5 ps-2">
        <span aria-hidden className="absolute inset-y-3 start-[calc(1.5rem-1px)] w-0.5 bg-line" />
        {history.map((h, idx) => {
          const i = statusInfo(s, h.to_status, "en");
          const I = ICON[h.to_status] ?? Check;
          const who = h.user_name ?? "system";
          const isCustomer = who === "customer", isSystem = who === "system";
          return (
            <li key={h.id} className="relative flex gap-3">
              <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-surface" style={{ background: i.color, color: "#fff" }}><I className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1 pb-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="font-bold" style={{ color: idx === 0 ? i.color : undefined }}>{i.label}</p>
                  {idx === 0 && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand">Current</span>}
                  <time className="ms-auto text-xs text-muted" dateTime={new Date(h.created_at).toISOString()} title={new Date(h.created_at).toLocaleString("en-GB")}>{when(h.created_at)}</time>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">{isCustomer ? <User className="size-3" aria-hidden /> : isSystem ? <CheckCheck className="size-3" aria-hidden /> : <span className="grid size-4 place-items-center rounded-full bg-sunken text-[9px] font-extrabold text-ink">{who.slice(0, 1).toUpperCase()}</span>}{isCustomer ? "Customer" : isSystem ? "System" : who}</span>
                  {h.from_status && <span>from {statusInfo(s, h.from_status, "en").label}</span>}
                  {(gap.get(h.id) ?? 0) > 60_000 && <span>· after {rel(gap.get(h.id) ?? 0)}</span>}
                </p>
                {h.note && <p className="mt-1.5 rounded-xl rounded-ss-sm bg-sunken px-3 py-2 text-sm">{h.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
