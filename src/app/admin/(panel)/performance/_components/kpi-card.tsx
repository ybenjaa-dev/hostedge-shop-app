import { ArrowDown, ArrowUp, Info, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { deltaTone, formatDelta, type Tone } from "@/features/performance/math";

const toneCls: Record<Tone, string> = { good: "bg-ok/12 text-ok", bad: "bg-danger/12 text-danger", flat: "bg-sunken text-muted" };

export type KpiDelta = { kind: "rel" | "points"; value: number | null; goodWhen: "up" | "down" | "neutral" };

/** A KPI tile: label with a definition tooltip, big value, and (optionally) the change against the previous period. */
export function KpiCard({ label, hint, value, sub, delta, tone }: { label: string; hint: string; value: ReactNode; sub?: ReactNode; delta?: KpiDelta | null; tone?: "ok" | "danger" }) {
  const t = delta ? deltaTone(delta.value, delta.goodWhen, delta.kind === "points" ? 0.0005 : 0.005) : "flat";
  const Icon = !delta || delta.value == null || Math.abs(delta.value) < 0.0005 ? Minus : delta.value > 0 ? ArrowUp : ArrowDown;
  return (
    <div className="card relative p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <span className="group relative -m-1 shrink-0 p-1">
          <button type="button" className="grid size-5 place-items-center rounded-full text-muted hover:text-ink" aria-label={`What is “${label}”? ${hint}`}><Info className="size-3.5" aria-hidden /></button>
          <span role="tooltip" className="pointer-events-none invisible absolute end-0 top-6 z-20 w-56 rounded-lg border border-line bg-surface p-2.5 text-xs font-normal normal-case leading-snug tracking-normal text-ink opacity-0 shadow-lg transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">{hint}</span>
        </span>
      </div>
      <p className={`display num mt-1 text-2xl font-extrabold ${tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : ""}`}>{value}</p>
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
        {delta && delta.value == null && <span className="text-[11px]" title="The previous period has no data to compare with">no prior data</span>}
        {delta && delta.value != null && (
          <span className={`num inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold ${toneCls[t]}`} title="Change vs the previous period of equal length">
            <Icon className="size-3" aria-hidden />{formatDelta(delta.kind, delta.value)}
            <span className="sr-only"> versus the previous period, {t === "good" ? "an improvement" : t === "bad" ? "a decline" : "about the same"}</span>
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}
