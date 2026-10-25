/** Parse "Label: value" lines (from the admin "facts" field) into table rows. Lines without a colon become a full-width note. */
export type FactRow = { label: string; value: string };
export function parseFacts(text: string): FactRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.search(/\s?[:：]\s/);
      const j = l.indexOf(":");
      const at = i >= 0 ? i : j;
      if (at <= 0) return { label: l, value: "" };
      return { label: l.slice(0, at).trim(), value: l.slice(at).replace(/^\s?[:：]\s?/, "").trim() };
    });
}
