import { describe, expect, it } from "vitest";
import { DAY, agentFlags, bucketMode, bucketize, compareBy, deltaPoints, deltaRel, deltaTone, formatDelta, formatDuration, formatPct, previousPeriod, rankAgents, resolveRange, safeRate, teamAverages } from "@/features/performance/math";

const NOW = Date.UTC(2026, 9, 28, 15, 0); // Wed 28 Oct 2026
const A = (o: Partial<Parameters<typeof agentFlags>[0]> = {}) => ({ userId: "a", handled: 20, confirmed: 15, confirmRate: 0.75, avgResponseMin: 10, delivered: 8, failed: 2, deliveredRate: 0.8, ...o });

describe("rates and deltas", () => {
  it("never divides by zero", () => {
    expect(safeRate(3, 0)).toBeNull();
    expect(safeRate(0, 0)).toBeNull();
    expect(safeRate(1, 4)).toBe(0.25);
    expect(deltaRel(5, 0)).toBeNull();
    expect(deltaRel(null, 5)).toBeNull();
    expect(deltaRel(15, 10)).toBeCloseTo(0.5);
    expect(deltaPoints(0.5, 0.4)).toBeCloseTo(0.1);
    expect(deltaPoints(null, 0.4)).toBeNull();
  });
  it("colours changes by direction and flatness", () => {
    expect(deltaTone(0.1, "up")).toBe("good");
    expect(deltaTone(0.1, "down")).toBe("bad");
    expect(deltaTone(-0.1, "down")).toBe("good");
    expect(deltaTone(0, "up")).toBe("flat");
    expect(deltaTone(null, "up")).toBe("flat");
    expect(deltaTone(0.5, "neutral")).toBe("flat");
  });
});

describe("ranges", () => {
  it("defaults to the last 30 UTC days, today included", () => {
    const r = resolveRange({}, NOW);
    expect(r.days).toBe(30);
    expect(r.to).toBe(Date.UTC(2026, 9, 29));
    expect(r.key).toBe("30");
  });
  it("handles presets, month and custom ranges", () => {
    expect(resolveRange({ range: "today" }, NOW).days).toBe(1);
    expect(resolveRange({ range: "7" }, NOW).from).toBe(Date.UTC(2026, 9, 22));
    expect(resolveRange({ range: "month" }, NOW)).toMatchObject({ from: Date.UTC(2026, 9, 1), days: 28, key: "month" });
    const c = resolveRange({ from: "2026-09-01", to: "2026-09-10" }, NOW);
    expect(c).toMatchObject({ from: Date.UTC(2026, 8, 1), to: Date.UTC(2026, 8, 11), days: 10, key: "custom" });
  });
  it("survives garbage, reversed and huge ranges", () => {
    expect(resolveRange({ range: "banana", from: "nope" }, NOW).days).toBe(30);
    const rev = resolveRange({ from: "2026-09-10", to: "2026-09-01" }, NOW);
    expect(rev.to).toBeGreaterThan(rev.from);
    expect(resolveRange({ from: "2000-01-01" }, NOW).days).toBe(366);
  });
  it("previous period has equal length and ends where the range starts", () => {
    const p = previousPeriod(Date.UTC(2026, 9, 1), Date.UTC(2026, 9, 11));
    expect(p).toEqual({ from: Date.UTC(2026, 8, 21), to: Date.UTC(2026, 9, 1) });
  });
});

describe("bucketing", () => {
  const from = Date.UTC(2026, 9, 19), to = Date.UTC(2026, 9, 29); // Mon 19 → Wed 28 (10 days)
  const rows = [{ day: "2026-10-19", orders: 4, handled: 2, confirmed: 1, delivered: 0 }, { day: "2026-10-27", orders: 6, handled: 4, confirmed: 3, delivered: 1 }];
  it("chooses day for short and week for long ranges", () => {
    expect(bucketMode(31)).toBe("day");
    expect(bucketMode(32)).toBe("week");
  });
  it("fills empty days", () => {
    const b = bucketize(rows, from, to, "day");
    expect(b).toHaveLength(10);
    expect(b[1]).toMatchObject({ orders: 0, rate: null });
    expect(b[0]!.rate).toBe(0.5);
  });
  it("groups Monday-start weeks and derives rates from sums", () => {
    const b = bucketize(rows, from, to, "week");
    expect(b.map((x) => x.label)).toEqual(["2026-10-19", "2026-10-26"]);
    expect(b[0]).toMatchObject({ orders: 4, confirmed: 1, handled: 2, rate: 0.5 });
    expect(b[1]).toMatchObject({ orders: 6, confirmed: 3, handled: 4, rate: 0.75 });
  });
  it("handles an empty range", () => {
    expect(bucketize([], from, to, "week").every((x) => x.orders === 0 && x.rate === null)).toBe(true);
    expect(bucketize([], to, from, "day")).toEqual([]);
  });
  it("weeks that start before the range still bucket by their Monday", () => {
    const b = bucketize([], Date.UTC(2026, 9, 21), Date.UTC(2026, 9, 22), "week"); // Wed-Thu
    expect(b.map((x) => x.label)).toEqual(["2026-10-19"]);
    expect(DAY).toBe(86_400_000);
  });
});

describe("formatting", () => {
  it("formats durations", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(0.2)).toBe("<1 min");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(90)).toBe("1.5 h");
    expect(formatDuration(2880)).toBe("2.0 d");
  });
  it("formats percentages and deltas", () => {
    expect(formatPct(null)).toBe("—");
    expect(formatPct(0.256)).toBe("26%");
    expect(formatPct(0.256, 1)).toBe("25.6%");
    expect(formatDelta("rel", 0.05)).toBe("+5.0%");
    expect(formatDelta("points", -0.032)).toBe("−3.2 pp");
    expect(formatDelta("rel", null)).toBe("—");
  });
});

describe("team helpers", () => {
  it("averages are pooled and null-safe", () => {
    expect(teamAverages([])).toEqual({ quality: null, response: null, confirmRate: null });
    const avg = teamAverages([A({ delivered: 9, failed: 1 }), A({ userId: "b", delivered: 1, failed: 9, avgResponseMin: null })]);
    expect(avg.quality).toBe(0.5);
    expect(avg.response).toBe(10);
  });
  it("flags clear outliers only, with enough data", () => {
    const avg = { quality: 0.8, response: 10, confirmRate: 0.7 };
    expect(agentFlags(A({ delivered: 4, failed: 8, deliveredRate: 0.33 }), avg).map((f) => f.key)).toEqual(["quality"]);
    expect(agentFlags(A({ delivered: 2, failed: 4, deliveredRate: 0.33 }), avg)).toEqual([]);
    expect(agentFlags(A({ avgResponseMin: 60 }), avg).map((f) => f.key)).toEqual(["slow"]);
    expect(agentFlags(A({ avgResponseMin: 12 }), avg)).toEqual([]);
    expect(agentFlags(A(), { quality: null, response: null, confirmRate: null })).toEqual([]);
  });
  it("ranks by confirmation rate and skips low-volume agents", () => {
    const r = rankAgents([A({ userId: "x", confirmRate: 0.6 }), A({ userId: "y", confirmRate: 0.9 }), A({ userId: "z", handled: 2, confirmRate: 1 }), A({ userId: "n", confirmRate: null })]);
    expect([...r.entries()]).toEqual([["y", 1], ["x", 2]]);
  });
  it("sorts with nulls last in both directions", () => {
    const xs = [{ v: 2 }, { v: null }, { v: 5 }];
    expect(xs.sort(compareBy((x) => x.v, "desc")).map((x) => x.v)).toEqual([5, 2, null]);
    expect(xs.sort(compareBy((x) => x.v, "asc")).map((x) => x.v)).toEqual([2, 5, null]);
  });
});
