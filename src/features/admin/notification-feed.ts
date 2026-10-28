/** Pure helpers for the admin notification bell (no server imports: used by the API route, the client and tests). */
export type FeedKind = "order" | "abandoned" | "stock" | "review" | "shipment";
export type FeedItem = {
  key: string; kind: FeedKind; at: number; href: string;
  title: string; lines: string[]; badge?: string;
};
export type FeedResponse = { ok: true; now: number; items: FeedItem[]; pending: number | null };

export const FEED_LIMIT = 20;
export const FEED_DAYS = 7;
export const LOW_STOCK_AT = 5;

/** Newest first, capped. */
export function mergeFeed(groups: FeedItem[][], limit = FEED_LIMIT): FeedItem[] {
  return groups.flat().sort((a, b) => b.at - a.at || a.key.localeCompare(b.key)).slice(0, limit);
}

export const isUnread = (it: { at: number }, lastSeen: number) => it.at > lastSeen;
export const countUnread = (items: { at: number }[], lastSeen: number) => items.reduce((n, i) => n + (i.at > lastSeen ? 1 : 0), 0);
/** The "seen" mark after "Mark all as read": never moves backwards. */
export const markAllSeen = (items: { at: number }[], now: number, prev: number) => Math.max(prev, now, ...items.map((i) => i.at));

export function timeAgo(at: number, now: number): string {
  const s = Math.max(0, Math.floor((now - at) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export const humanize = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
export const bellCount = (n: number) => (n > 9 ? "9+" : String(n));
