"use client";
import type { Lang } from "@/lib/i18n-core";
import { Flag } from "@/components/flags";

export const ADMIN_LANGS: { id: Lang; label: string }[] = [{ id: "fr", label: "Français" }, { id: "ar", label: "العربية" }, { id: "en", label: "English" }];

/** Segmented language switcher for translated fields. A dot shows which languages already have content. */
export function LangTabs({ active, onChange, filled, idPrefix }: { active: Lang; onChange: (l: Lang) => void; filled: Partial<Record<Lang, boolean>>; idPrefix: string }) {
  return (
    <div role="tablist" aria-label="Language" className="inline-flex gap-0.5 rounded-xl border border-line bg-sunken p-0.5">
      {ADMIN_LANGS.map((l) => (
        <button key={l.id} type="button" role="tab" id={`${idPrefix}-tab-${l.id}`} aria-selected={active === l.id} aria-controls={`${idPrefix}-panel-${l.id}`} tabIndex={active === l.id ? 0 : -1}
          onClick={() => onChange(l.id)}
          onKeyDown={(e) => {
            const i = ADMIN_LANGS.findIndex((x) => x.id === active);
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); onChange(ADMIN_LANGS[(i + (e.key === "ArrowRight" ? 1 : ADMIN_LANGS.length - 1)) % ADMIN_LANGS.length]!.id); }
          }}
          className={`inline-flex items-center gap-1.5 rounded-[0.65rem] px-2.5 py-1.5 text-xs font-bold transition ${active === l.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
          <Flag lang={l.id} className="h-3.5 w-[1.15rem]" />
          <span className="uppercase">{l.id}</span>
          <span aria-hidden className={`size-1.5 rounded-full ${filled[l.id] ? "bg-ok" : "bg-line"}`} title={filled[l.id] ? "Has content" : "Empty"} />
          <span className="sr-only">{l.label}{filled[l.id] ? " (has content)" : " (empty)"}</span>
        </button>
      ))}
    </div>
  );
}
