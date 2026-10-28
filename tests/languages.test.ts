import { describe, expect, it, afterEach } from "vitest";
import { allLangs, dirOf, isLang, labelOf, setCustomLangs, tr } from "@/lib/i18n-core";
import { LANG_PRESETS, flagEmoji } from "@/lib/lang-presets";

afterEach(() => setCustomLangs([]));

describe("language registry", () => {
  it("knows the three built-in languages", () => {
    expect(allLangs()).toEqual(["ar", "fr", "en"]);
    expect(dirOf("ar")).toBe("rtl");
    expect(isLang("es")).toBe(false);
  });
  it("accepts languages added by the owner, with their direction", () => {
    setCustomLangs([{ code: "ur", name: "Urdu", native: "اردو", dir: "rtl", flag: "PK" }, { code: "es", name: "Spanish", native: "Español", dir: "ltr", flag: "ES" }]);
    expect(isLang("ur") && isLang("es")).toBe(true);
    expect(dirOf("ur")).toBe("rtl");
    expect(labelOf("es")).toBe("Español");
  });
  it("cannot shadow a built-in language", () => {
    setCustomLangs([{ code: "fr", name: "x", native: "x", dir: "rtl", flag: "" }]);
    expect(dirOf("fr")).toBe("ltr");
    expect(allLangs()).toEqual(["ar", "fr", "en"]);
  });
  it("falls back to another language for untranslated content", () => {
    setCustomLangs([{ code: "es", name: "Spanish", native: "Español", dir: "ltr", flag: "ES" }]);
    expect(tr({ en: "Shoes", es: "Zapatos" }, "es")).toBe("Zapatos");
    expect(tr({ en: "Shoes" }, "es")).toBe("Shoes");
  });
  it("presets are valid two-letter codes with flags", () => {
    for (const p of LANG_PRESETS) { expect(p.code).toMatch(/^[a-z]{2}$/); expect(flagEmoji(p.flag)).not.toBe("🌐"); }
    expect(new Set(LANG_PRESETS.map((p) => p.code)).size).toBe(LANG_PRESETS.length);
  });
});
