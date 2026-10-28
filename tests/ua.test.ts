import { describe, expect, it } from "vitest";
import { parseUA } from "@/lib/ua";

describe("parseUA", () => {
  it("reads common browsers", () => {
    expect(parseUA("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36")).toEqual({ browser: "Chrome", os: "Android", device: "mobile" });
    expect(parseUA("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toEqual({ browser: "Safari", os: "iOS", device: "mobile" });
    expect(parseUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 Edg/126.0")).toEqual({ browser: "Edge", os: "Windows", device: "desktop" });
  });
  it("flags in-app browsers, tablets and bots", () => {
    expect(parseUA("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450]").browser).toBe("Facebook app");
    expect(parseUA("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1").device).toBe("tablet");
    expect(parseUA("Googlebot/2.1 (+http://www.google.com/bot.html)").device).toBe("bot");
  });
});
