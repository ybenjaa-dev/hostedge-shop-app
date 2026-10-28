import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { SERVER_ONLY_PREFIXES, clientDict } from "@/lib/client-dict";

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) ? [p] : []; });

describe("client dictionary", () => {
  it("drops server-only groups and keeps the rest", () => {
    const d = clientDict({ "home.title": "x", "cod.title": "y", "faq.q1": "z", "p.soldOut": "s" });
    expect(Object.keys(d).sort()).toEqual(["cod.title", "p.soldOut"]);
  });
  it("no client component asks for a text that was left out", () => {
    const bad: string[] = [];
    for (const f of walk("src")) {
      const s = readFileSync(f, "utf8");
      if (!/useT\(\)/.test(s)) continue;
      for (const m of s.matchAll(/\bt\("([a-zA-Z0-9_.]+)"/g)) if (SERVER_ONLY_PREFIXES.some((p) => m[1]!.startsWith(p))) bad.push(`${f}: ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });
});
