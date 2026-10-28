import { describe, expect, it } from "vitest";
import { parseOptions, stringifyOptions } from "@/lib/shop-filters";

describe("option filters", () => {
  it("round-trips", () => { const o = parseOptions("Size:M|Size:L|Color:Black"); expect(o).toEqual({ Size: ["M", "L"], Color: ["Black"] }); expect(stringifyOptions(o)).toBe("Size:M|Size:L|Color:Black"); });
  it("ignores junk and caps size", () => { expect(parseOptions("nope|:x|k:")).toEqual({}); expect(parseOptions(undefined)).toEqual({}); expect(Object.keys(parseOptions("a:1|b:1|c:1|d:1|e:1")).length).toBe(4); });
  it("accepts repeated query params", () => { expect(parseOptions(["Size:M", "Color:Red"])).toEqual({ Size: ["M"], Color: ["Red"] }); });
});
