import { deltaPoints, deltaRel, formatDuration, formatPct, safeRate } from "./math";
import { rates, type Abandoned, type KpiData } from "./queries";
import { formatMoney } from "@/lib/money";

export type Metric = {
  key: string; label: string; hint: string; money?: boolean;
  cur: number | null; prev: number | null;
  kind: "count" | "rate" | "duration" | "money";
  goodWhen: "up" | "down" | "neutral";
  sub?: string;
};

const rec = (a: Abandoned) => (a ? safeRate(a.recovered, a.total) : null);

/** The KPI definitions, in display order. Pure data so the page and the CSV export can never disagree. */
export function buildMetrics(d: KpiData): Metric[] {
  const c = rates(d.cur), p = rates(d.prev);
  const m: Metric[] = [
    { key: "orders", label: "Orders", hint: "Orders placed in the selected dates, whatever their status today.", cur: d.cur.orders, prev: d.prev.orders, kind: "count", goodWhen: "up" },
    { key: "confirmation", label: "Confirmation rate", hint: "Orders confirmed ÷ orders the team handled (confirmed, cancelled, no answer or postponed). Orders still waiting are not counted.", cur: c.confirmation, prev: p.confirmation, kind: "rate", goodWhen: "up", sub: `${d.cur.confirmed} of ${d.cur.handled} handled` },
    { key: "delivery", label: "Delivery rate", hint: "Delivered (cash collected) ÷ orders handed to the carrier. Orders still in transit lower it until they land.", cur: c.delivery, prev: p.delivery, kind: "rate", goodWhen: "up", sub: `${d.cur.delivered} of ${d.cur.shipped} shipped` },
    { key: "returns", label: "Return / refusal rate", hint: "Failed deliveries, returns and refunds ÷ orders handed to the carrier. Lower is better.", cur: c.returns, prev: p.returns, kind: "rate", goodWhen: "down", sub: `${d.cur.failed} of ${d.cur.shipped} shipped` },
    { key: "cancelled", label: "Cancelled rate", hint: "Orders now cancelled ÷ all orders placed.", cur: c.cancelled, prev: p.cancelled, kind: "rate", goodWhen: "down", sub: `${d.cur.cancelled} cancelled` },
    { key: "noAnswer", label: "No-answer rate", hint: "Orders where the customer did not pick up at least once ÷ orders handled.", cur: c.noAnswer, prev: p.noAnswer, kind: "rate", goodWhen: "down", sub: `${d.cur.noAnswer} orders` },
    { key: "handle", label: "Time to first handling", hint: "Average time from the order being placed to the team's first decision (confirm, cancel, no answer, postpone).", cur: d.cur.avgHandleMin, prev: d.prev.avgHandleMin, kind: "duration", goodWhen: "down" },
    { key: "confirm", label: "Time to confirm", hint: "Average time from the order being placed to it being confirmed.", cur: d.cur.avgConfirmMin, prev: d.prev.avgConfirmMin, kind: "duration", goodWhen: "down" },
    { key: "ship", label: "Time to ship", hint: "Average time from confirmation to the order being marked shipped.", cur: d.cur.avgShipMin, prev: d.prev.avgShipMin, kind: "duration", goodWhen: "down" },
    { key: "deliveredRevenue", label: "Delivered revenue", hint: "Total of orders that were delivered and paid in cash. The money that actually came in.", money: true, cur: d.cur.deliveredRevenue, prev: d.prev.deliveredRevenue, kind: "money", goodWhen: "up" },
    { key: "grossValue", label: "Gross order value", hint: "Total of every order placed, minus cancelled ones, whether or not it was delivered.", money: true, cur: d.cur.grossValue, prev: d.prev.grossValue, kind: "money", goodWhen: "up" },
    { key: "aov", label: "Average order value", hint: "Gross order value ÷ non-cancelled orders.", money: true, cur: c.aov, prev: p.aov, kind: "money", goodWhen: "up" },
    { key: "addon", label: "Add-on take rate", hint: "Share of orders where the customer added a one-tap offer after checkout.", cur: c.addon, prev: p.addon, kind: "rate", goodWhen: "up", sub: `${d.cur.addonOrders} orders` },
    { key: "offer", label: "Bundle / offer rate", hint: "Share of orders that got a quantity or bundle discount (coupons excluded).", cur: c.offer, prev: p.offer, kind: "rate", goodWhen: "up", sub: `${d.cur.offerOrders} orders` },
  ];
  if (d.abandoned.cur) m.push({ key: "recovery", label: "Checkout recovery", hint: "Abandoned checkouts that ended up as an order ÷ all abandoned checkouts started in the range.", cur: rec(d.abandoned.cur), prev: rec(d.abandoned.prev), kind: "rate", goodWhen: "up", sub: `${d.abandoned.cur.recovered} of ${d.abandoned.cur.total} recovered` });
  return m;
}

export function deltaOf(m: Metric) {
  return m.kind === "rate" ? { kind: "points" as const, value: deltaPoints(m.cur, m.prev), goodWhen: m.goodWhen } : { kind: "rel" as const, value: deltaRel(m.cur, m.prev), goodWhen: m.goodWhen };
}
export function display(m: Metric, value: number | null, currency: string): string {
  if (value == null) return "—";
  return m.kind === "rate" ? formatPct(value, 1) : m.kind === "duration" ? formatDuration(value) : m.kind === "money" ? formatMoney(Math.round(value), currency, "en") : String(value);
}
