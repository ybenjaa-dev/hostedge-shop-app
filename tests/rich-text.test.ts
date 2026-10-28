import { describe, expect, it } from "vitest";
import { plainToHtml, sanitizeHtml, stripHtml } from "@/lib/rich-text";

describe("sanitizeHtml", () => {
  it("keeps basic formatting", () => {
    expect(sanitizeHtml("<p>Hi <strong>there</strong></p><ul><li>a</li><li>b</li></ul>")).toBe("<p>Hi <strong>there</strong></p><ul><li>a</li><li>b</li></ul>");
  });
  it("drops scripts, handlers and unknown tags but keeps text", () => {
    const out = sanitizeHtml('<p onclick="x()">a<script>alert(1)</script><span style="color:red">b</span><img src=x onerror=alert(1)></p>');
    expect(out).toBe("<p>ab</p>");
  });
  it("only allows safe links", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("x");
    expect(sanitizeHtml('<a href="https://a.test/?q=1&b=2">x</a>')).toContain('rel="noopener noreferrer nofollow"');
    expect(sanitizeHtml('<a href="/p/shoes">x</a>')).toBe('<a href="/p/shoes">x</a>');
  });
  it("turns legacy plain text into paragraphs", () => {
    expect(sanitizeHtml("One\nline\n\nSecond & 3 < 4")).toBe("<p>One<br>line</p><p>Second &amp; 3 &lt; 4</p>");
    expect(plainToHtml("")).toBe("");
  });
  it("closes unclosed tags and drops empty paragraphs", () => {
    expect(sanitizeHtml("<p>a<strong>b")).toBe("<p>a<strong>b</strong></p>");
    expect(sanitizeHtml("<p><br></p><p>x</p>")).toBe("<p>x</p>");
  });
  it("normalises b/i and headings", () => {
    expect(sanitizeHtml("<h1>T</h1><b>x</b>")).toBe("<h2>T</h2><strong>x</strong>");
  });
  it("strips to text", () => { expect(stripHtml("<p>A</p><p>B &amp; C</p>")).toBe("A B & C"); });
});
