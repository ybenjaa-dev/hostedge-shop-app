import { renderRich } from "@/lib/rich-text";

/** Renders admin-written rich text (sanitised again here) or legacy plain text. */
export function RichText({ html, className = "prose-lite" }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderRich(html) }} />;
}
