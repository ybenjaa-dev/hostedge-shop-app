import { describe, expect, it } from "vitest";
import { parseCsv, csvCell, toCsv } from "@/lib/csv";

describe("csv", () => {
  it("parses quotes, commas and newlines", () => {
    expect(parseCsv('a,b\r\n"x,1","he said ""hi"""\n')).toEqual([["a", "b"], ["x,1", 'he said "hi"']]);
  });
  it("neutralises formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+212600")).toBe("'+212600");
    expect(toCsv([["a", "b,c"]])).toContain('"b,c"');
  });
});
