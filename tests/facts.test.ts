import { describe, expect, it } from "vitest";
import { parseFacts } from "@/lib/facts";
import { goalIcon } from "@/lib/goal-icon";
import { Zap, Moon, Pill } from "lucide-react";

describe("facts", () => {
  it("parses label: value lines in any language", () => {
    expect(parseFacts("Serving size: 1 capsule\nVitamin D3: 50 µg (2000 IU)\n\nPortion : 2 gélules")).toEqual([
      { label: "Serving size", value: "1 capsule" },
      { label: "Vitamin D3", value: "50 µg (2000 IU)" },
      { label: "Portion", value: "2 gélules" },
    ]);
    expect(parseFacts("الحصة: كبسولة واحدة")[0]).toEqual({ label: "الحصة", value: "كبسولة واحدة" });
  });
  it("keeps lines without a colon", () => {
    expect(parseFacts("Gluten free")).toEqual([{ label: "Gluten free", value: "" }]);
  });
  it("maps goals to icons", () => {
    expect(goalIcon("energy")).toBe(Zap);
    expect(goalIcon("النوم والتوتر")).toBe(Moon);
    expect(goalIcon("zzz")).toBe(Pill);
  });
});
