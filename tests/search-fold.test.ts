import { describe, expect, it } from "vitest";
import { fold, tokens } from "@/lib/search-fold";

describe("search folding", () => {
  it("ignores accents and case", () => { expect(fold("Poêle Céramique")).toBe("poele ceramique"); expect(tokens("POELE  céramique")).toEqual(["poele", "ceramique"]); });
  it("normalises Arabic variants and digits", () => {
    expect(fold("أحمر")).toBe(fold("احمر"));
    expect(fold("مَقَالٍ")).toBe("مقال");
    expect(fold("حقيبة")).toBe(fold("حقيبه"));
    expect(fold("٣ قطع")).toBe("3 قطع");
  });
  it("keeps useful tokens only", () => { expect(tokens("a b")).toEqual([]); expect(tokens("x ، سيراميك")).toEqual(["سيراميك"]); expect(tokens("a a  shoe shoe")).toEqual(["shoe"]); });
});
