/** Pure maths for the Team performance page: rates, deltas, ranges, bucketing, formatting. No server imports (unit-tested). */
export const DAY = 86_400_000;
export const MAX_DAYS = 366;

/** n ÷ d, or null when there is nothing to divide by (never NaN / Infinity). */
export const safeRate = (n: number, d: number): number | null => (d > 0 ? n / d : null);

/** Relative change in percent-of-previous (0.25 = +25 %); null when the previous period has no base. */
export function deltaRel(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return (cur - prev) / Math.abs(prev);
}
/** Absolute change in points for rates (0.032 = +3.2 pp); null when either side is unknown. */
export function deltaPoints(cur: number | null, prev: number | null): number | null {
  return cur == null || prev == null ? null : cur - prev;
}
export type Tone = "good" | "bad" | "flat";
/** Colour of a change. `goodWhen` says which direction is an improvement; tiny moves count as flat. */
export function deltaTone(delta: number | null, goodWhen: "up" | "down" | "neutral", eps = 0.0005): Tone {
  if (delta == null || Math.abs(delta) < eps || goodWhen === "neutral") return "flat";
  return (delta > 0) === (goodWhen === "up") ? "good" : "bad";
}

export type Range = { from: number; to: number; days: number; key: string };
/** `from` inclusive, `to` exclusive, both UTC midnights (same convention as the dashboard). */
export function resolveRange(q: { range?: string; from?: string; to?: string }, now = Date.now()): Range {
  const endToday = Math.floor(now / DAY) * DAY + DAY;
  const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`));
  let from: number, to: number, key: string;
  if (isDay(q.from) || isDay(q.to)) {
    to = isDay(q.to) ? Date.parse(`${q.to}T00:00:00Z`) + DAY : endToday;
    from = isDay(q.from) ? Date.parse(`${q.from}T00:00:00Z`) : to - 30 * DAY;
    if (from >= to) [from, to] = [to - DAY, from + DAY];
    key = "custom";
  } else if (q.range === "month") {
    const d = new Date(now);
    from = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); to = endToday; key = "month";
  } else {
    const days = { today: 1, "7": 7, "30": 30, "90": 90 }[q.range ?? ""] ?? 30;
    key = q.range && q.range in { today: 1, "7": 1, "30": 1, "90": 1 } ? q.range : "30";
    from = endToday - days * DAY; to = endToday;
  }
  if (to - from > MAX_DAYS * DAY) from = to - MAX_DAYS * DAY;
  return { from, to, days: Math.round((to - from) / DAY), key };
}
/** The window of equal length immediately before [from, to). */
export const previousPeriod = (from: number, to: number) => ({ from: from - (to - from), to: from });

export const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export type DayRow = { day: string; orders: number; handled: number; confirmed: number; delivered: number };
export type Bucket = DayRow & { label: string; rate: number | null };
/** Weekly buckets for ranges over a month, daily otherwise. */
export const bucketMode = (days: number): "day" | "week" => (days > 31 ? "week" : "day");

/** Fill every day of the range, then group into days or Monday-start weeks. Rates are re-derived from sums, never averaged. */
export function bucketize(rows: DayRow[], from: number, to: number, mode: "day" | "week"): Bucket[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out = new Map<string, Bucket>();
  for (let t = Math.floor(from / DAY) * DAY; t < to; t += DAY) {
    const day = isoDay(t);
    const key = mode === "day" ? day : isoDay(t - ((new Date(t).getUTCDay() + 6) % 7) * DAY);
    const b = out.get(key) ?? { day: key, label: key, orders: 0, handled: 0, confirmed: 0, delivered: 0, rate: null };
    const r = byDay.get(day);
    if (r) { b.orders += r.orders; b.handled += r.handled; b.confirmed += r.confirmed; b.delivered += r.delivered; }
    out.set(key, b);
  }
  return [...out.values()].map((b) => ({ ...b, rate: safeRate(b.confirmed, b.handled) }));
}

/** Compact duration from minutes: 45 min, 3.5 h, 2.1 d. */
export function formatDuration(min: number | null | undefined): string {
  if (min == null || !Number.isFinite(min)) return "—";
  if (min < 1) return "<1 min";
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 1440) return `${(min / 60).toFixed(1)} h`;
  return `${(min / 1440).toFixed(1)} d`;
}
export const formatPct = (r: number | null | undefined, digits = 0): string => (r == null || !Number.isFinite(r) ? "—" : `${(r * 100).toFixed(digits)}%`);
export function formatDelta(kind: "rel" | "points", d: number | null): string {
  if (d == null) return "—";
  const v = d * 100;
  const s = Math.abs(v) >= 10 ? Math.round(Math.abs(v)).toString() : Math.abs(v).toFixed(1);
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${s}${kind === "rel" ? "%" : " pp"}`;
}

/** Share of `part` in `whole` as 0..100 width for inline bars. */
export const barWidth = (part: number, max: number): number => (max > 0 ? Math.max(0, Math.min(100, (part / max) * 100)) : 0);

export type AgentLike = {
  userId: string; handled: number; confirmed: number; confirmRate: number | null; avgResponseMin: number | null;
  delivered: number; failed: number; deliveredRate: number | null;
};
export type TeamAverages = { quality: number | null; response: number | null; confirmRate: number | null };
export function teamAverages(agents: AgentLike[]): TeamAverages {
  const d = agents.reduce((s, a) => s + a.delivered, 0), f = agents.reduce((s, a) => s + a.failed, 0);
  const h = agents.reduce((s, a) => s + a.handled, 0), c = agents.reduce((s, a) => s + a.confirmed, 0);
  const rs = agents.filter((a) => a.avgResponseMin != null && a.confirmed > 0); // packers etc. don't answer new orders
  return { quality: safeRate(d, d + f), confirmRate: safeRate(c, h), response: rs.length ? rs.reduce((s, a) => s + a.avgResponseMin!, 0) / rs.length : null };
}
export type Flag = { key: "quality" | "slow"; label: string };
/** Gentle outlier flags. Needs enough data per person to mean anything. */
export function agentFlags(a: AgentLike, avg: TeamAverages, minResolved = 10): Flag[] {
  const flags: Flag[] = [];
  if (a.delivered + a.failed >= minResolved && a.deliveredRate != null && avg.quality != null && avg.quality - a.deliveredRate >= 0.15)
    flags.push({ key: "quality", label: `Delivered share of confirmed orders is ${Math.round((avg.quality - a.deliveredRate) * 100)} pp below the team (${formatPct(avg.quality)})` });
  if (a.handled >= 5 && a.confirmed > 0 && a.avgResponseMin != null && avg.response != null && avg.response > 0 && a.avgResponseMin >= avg.response * 2 && a.avgResponseMin - avg.response >= 30)
    flags.push({ key: "slow", label: `First reply takes about ${(a.avgResponseMin / avg.response).toFixed(1)}× the team average (${formatDuration(avg.response)})` });
  return flags;
}

/** Rank by confirmation rate (ties → more handled). Agents with too little data get no rank. */
export function rankAgents<T extends AgentLike>(agents: T[], minHandled = 5): Map<string, number> {
  const ranked = agents.filter((a) => a.handled >= minHandled && a.confirmed > 0 && a.confirmRate != null)
    .sort((a, b) => (b.confirmRate! - a.confirmRate!) || b.handled - a.handled);
  return new Map(ranked.map((a, i) => [a.userId, i + 1]));
}

export type SortDir = "asc" | "desc";
/** Null-safe numeric/text comparator; nulls always sink to the bottom. */
export function compareBy<T>(get: (x: T) => number | string | null, dir: SortDir) {
  return (a: T, b: T) => {
    const x = get(a), y = get(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    const c = typeof x === "string" || typeof y === "string" ? String(x).localeCompare(String(y)) : x - y;
    return dir === "asc" ? c : -c;
  };
}
