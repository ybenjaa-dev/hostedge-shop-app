/** Tiny allow-list HTML sanitiser (no DOM needed, so it runs in Workers). Used when saving AND when rendering rich text. */
const BLOCK = new Set(["p", "h2", "h3", "ul", "ol", "li", "blockquote"]);
const INLINE = new Set(["strong", "em", "u", "s", "a"]);
const ALIAS: Record<string, string> = { b: "strong", i: "em", strike: "s", del: "s", div: "p", h1: "h2", h4: "h3", h5: "h3", h6: "h3" };
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "template", "noscript", "svg", "math"]);
const VOID_OK = new Set(["br", "hr"]);

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const escText = (s: string) => s.replace(/&(?!(?:#\d{1,6}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,10});)/gi, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function safeHref(raw: string): string | null {
  const v = raw.trim().replace(/&amp;/g, "&");
  if (/^(https?:\/\/|mailto:|tel:)/i.test(v) || /^\/(?!\/)/.test(v) || v.startsWith("#")) return escapeHtml(v);
  return null;
}

/** Plain text (blank-line separated paragraphs) → HTML. */
export function plainToHtml(text: string): string {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${escText(p).replace(/\n/g, "<br>")}</p>`).join("");
}
const looksLikeHtml = (s: string) => /<\/?[a-z][^>]*>/i.test(s);

export function sanitizeHtml(input: string, max = 60_000): string {
  const src = (input ?? "").slice(0, max * 2);
  if (!looksLikeHtml(src)) return plainToHtml(src).slice(0, max);
  const out: string[] = [];
  const stack: string[] = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|[^<]+|</g;
  let skipUntil: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const tok = m[0];
    if (tok.startsWith("<!--")) continue;
    if (!m[1]) { if (!skipUntil) out.push(tok === "<" ? "&lt;" : escText(tok)); continue; }
    const closing = tok.startsWith("</");
    const raw = m[1].toLowerCase();
    if (skipUntil) { if (closing && raw === skipUntil) skipUntil = null; continue; }
    if (!closing && DROP_WITH_CONTENT.has(raw) && !tok.endsWith("/>")) { skipUntil = raw; continue; }
    const tag = ALIAS[raw] ?? raw;
    if (VOID_OK.has(tag)) { if (!closing) out.push(`<${tag}>`); continue; }
    if (!BLOCK.has(tag) && !INLINE.has(tag)) continue; // unknown / span / font…: keep the text, drop the tag
    if (closing) {
      const i = stack.lastIndexOf(tag);
      if (i < 0) continue;
      while (stack.length > i) out.push(`</${stack.pop()}>`);
      continue;
    }
    // block elements can't live inside inline ones or inside <p>
    if (BLOCK.has(tag)) {
      if (tag === "li") { while (stack.length && stack[stack.length - 1] !== "ul" && stack[stack.length - 1] !== "ol") out.push(`</${stack.pop()}>`); if (!stack.length) { out.push("<ul>"); stack.push("ul"); } }
      else while (stack.length && (INLINE.has(stack[stack.length - 1]!) || stack[stack.length - 1] === "p" || /^h[23]$/.test(stack[stack.length - 1]!))) out.push(`</${stack.pop()}>`);
    }
    if (tag === "a") {
      const h = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[2] ?? "");
      const href = h ? safeHref(h[1] ?? h[2] ?? h[3] ?? "") : null;
      if (!href) continue;
      const ext = /^https?:/i.test(href);
      out.push(`<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer nofollow"' : ""}>`);
    } else out.push(`<${tag}>`);
    stack.push(tag);
    if (stack.length > 40) break;
  }
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join("").replace(/<p>(\s|<br>)*<\/p>/g, "").slice(0, max * 2);
}

/** What to put in the page: rich HTML as-is (sanitised), legacy plain text as paragraphs. */
export const renderRich = (value: string) => sanitizeHtml(value);

/** Plain-text summary of rich content (SEO descriptions, CSV…). */
export const stripHtml = (s: string) => s.replace(/<(br|\/p|\/li|\/h[2-4]|\/blockquote)\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
