"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Bold, Eraser, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Underline, Undo2 } from "lucide-react";
import type { Lang } from "@/lib/i18n-core";
import { plainToHtml, sanitizeHtml, stripHtml } from "@/lib/rich-text";
import { ADMIN_LANGS, LangTabs } from "./lang-tabs";

type Vals = Partial<Record<Lang, string>>;
const html = (s: string | undefined) => (s ? sanitizeHtml(s) : "");

function Editor({ lang, id, initial, onHtml, onFocusEditor, editorRef, label, minHeight }: { lang: Lang; id: string; initial: string; onHtml: (h: string) => void; onFocusEditor: () => void; editorRef: (el: HTMLDivElement | null) => void; label: string; minHeight: string }) {
  const el = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (el.current && !el.current.innerHTML) el.current.innerHTML = initial; }, [initial]);
  return (
    <div id={id} ref={(n) => { el.current = n; editorRef(n); }} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={label} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} data-placeholder="Write here…"
      className="rte-body prose-lite" style={{ minHeight }}
      onFocus={onFocusEditor}
      onInput={(e) => onHtml((e.currentTarget as HTMLDivElement).innerHTML)}
      onBlur={(e) => onHtml(sanitizeHtml((e.currentTarget as HTMLDivElement).innerHTML))}
      onPaste={(e) => { e.preventDefault(); const t = e.clipboardData.getData("text/html"); const p = e.clipboardData.getData("text/plain"); document.execCommand("insertHTML", false, t ? sanitizeHtml(t) : plainToHtml(p)); }} />
  );
}

/** Rich-text editor with a language tab bar. Submits sanitised HTML as `name.fr` / `name.ar` / `name.en` (hidden inputs). */
export function RichTextField({ label, name, value = {}, hint, minHeight = "11rem" }: { label: string; name: string; value?: Vals; hint?: string; minHeight?: string }) {
  const uid = useId();
  const [active, setActive] = useState<Lang>(() => (ADMIN_LANGS.find((l) => value[l.id]?.trim())?.id ?? "fr"));
  const [vals, setVals] = useState<Vals>(() => ({ fr: html(value.fr), ar: html(value.ar), en: html(value.en) }));
  const [refs] = useState<Partial<Record<Lang, HTMLDivElement | null>>>(() => ({}));
  const exec = (cmd: string, arg?: string) => { refs[active]?.focus(); document.execCommand(cmd, false, arg); setVals((v) => ({ ...v, [active]: refs[active]?.innerHTML ?? "" })); };
  const block = (tag: string) => exec("formatBlock", tag);
  const link = () => {
    const sel = window.getSelection();
    const url = window.prompt("Link address (https://…)", "https://");
    if (!url) return;
    if (sel && sel.isCollapsed) exec("insertHTML", `<a href="${url.replace(/"/g, "&quot;")}">${url.replace(/</g, "&lt;")}</a>`); else exec("createLink", url);
  };
  const tools: { icon: typeof Bold; title: string; run: () => void; gap?: boolean }[] = [
    { icon: Bold, title: "Bold", run: () => exec("bold") }, { icon: Italic, title: "Italic", run: () => exec("italic") }, { icon: Underline, title: "Underline", run: () => exec("underline") },
    { icon: Heading2, title: "Heading", run: () => block("h2"), gap: true }, { icon: Heading3, title: "Subheading", run: () => block("h3") },
    { icon: List, title: "Bulleted list", run: () => exec("insertUnorderedList"), gap: true }, { icon: ListOrdered, title: "Numbered list", run: () => exec("insertOrderedList") }, { icon: Quote, title: "Quote", run: () => block("blockquote") },
    { icon: Link2, title: "Link", run: link, gap: true }, { icon: Eraser, title: "Clear formatting", run: () => { exec("removeFormat"); block("p"); } },
    { icon: Undo2, title: "Undo", run: () => exec("undo"), gap: true }, { icon: Redo2, title: "Redo", run: () => exec("redo") },
  ];
  const filled = Object.fromEntries(ADMIN_LANGS.map((l) => [l.id, stripHtml(vals[l.id] ?? "").length > 0])) as Record<Lang, boolean>;
  return (
    <fieldset>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><legend className="label !mb-0">{label}</legend><LangTabs active={active} onChange={setActive} filled={filled} idPrefix={uid} /></div>
      <div className="rte">
        <div className="rte-bar" role="toolbar" aria-label="Formatting">
          {tools.map((t) => (
            <span key={t.title} className="contents">
              {t.gap && <span className="rte-sep" aria-hidden />}
              <button type="button" title={t.title} aria-label={t.title} onMouseDown={(e) => e.preventDefault()} onClick={t.run} className="rte-btn"><t.icon className="size-4" aria-hidden /></button>
            </span>
          ))}
        </div>
        {ADMIN_LANGS.map((l) => (
          <div key={l.id} role="tabpanel" id={`${uid}-panel-${l.id}`} aria-labelledby={`${uid}-tab-${l.id}`} hidden={active !== l.id}>
            <Editor lang={l.id} id={`${uid}-${l.id}`} initial={html(value[l.id])} label={`${label} (${l.label})`} minHeight={minHeight} onFocusEditor={() => {}}
              editorRef={(n) => { refs[l.id] = n; }} onHtml={(h) => setVals((v) => ({ ...v, [l.id]: h }))} />
            <input type="hidden" name={`${name}.${l.id}`} value={stripHtml(vals[l.id] ?? "") ? sanitizeHtml(vals[l.id] ?? "") : ""} />
          </div>
        ))}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}
