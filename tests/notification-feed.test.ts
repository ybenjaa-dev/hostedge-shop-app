import { describe, expect, it } from "vitest";
import { countUnread, markAllSeen, mergeFeed, timeAgo, bellCount, humanize, type FeedItem } from "@/features/admin/notification-feed";

const it_ = (key: string, at: number): FeedItem => ({ key, kind: "order", at, href: "/x", title: key, lines: [] });

describe("notification feed", () => {
  it("merges newest first and caps", () => {
    const out = mergeFeed([[it_("a", 1), it_("b", 5)], [it_("c", 3)]], 2);
    expect(out.map((i) => i.key)).toEqual(["b", "c"]);
  });
  it("counts unread against the last-seen mark", () => {
    const items = [it_("a", 10), it_("b", 20), it_("c", 30)];
    expect(countUnread(items, 20)).toBe(1);
    expect(countUnread(items, 0)).toBe(3);
  });
  it("mark all seen never goes backwards", () => {
    expect(markAllSeen([it_("a", 50)], 40, 10)).toBe(50);
    expect(markAllSeen([], 40, 100)).toBe(100);
  });
  it("formats time ago", () => {
    const now = 10_000_000_000;
    expect(timeAgo(now - 10_000, now)).toBe("just now");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("5m ago");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("3h ago");
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe("2d ago");
    expect(timeAgo(now + 5000, now)).toBe("just now");
  });
  it("small formatters", () => {
    expect(bellCount(12)).toBe("9+");
    expect(bellCount(3)).toBe("3");
    expect(humanize("pending_confirmation")).toBe("Pending confirmation");
  });
});
