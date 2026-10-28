/** Bookshop convention: a product's long description may end with "::Label: value" lines (pages, format, publisher…). They become the "book details" table; the rest is the reading sample. */
export function splitBookDesc(text: string): { body: string; meta: [string, string][] } {
  const meta: [string, string][] = [];
  const body: string[] = [];
  for (const line of text.split("\n")) {
    const m = /^::\s*([^:]{1,40}):\s*(.+)$/.exec(line.trim());
    if (m) meta.push([m[1]!.trim(), m[2]!.trim()]);
    else body.push(line);
  }
  return { body: body.join("\n").trim(), meta };
}
