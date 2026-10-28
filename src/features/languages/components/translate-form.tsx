"use client";
import { AdminForm } from "@/features/admin/components/admin-form";
import { saveTranslations } from "../actions";

export type Row = { key: string; source: string; value: string; edited: boolean };

/** One page of texts: source on the left, the translation on the right. Saves only what changed on this page. */
export function TranslateForm({ code, dir, rows }: { code: string; dir: "ltr" | "rtl"; rows: Row[] }) {
  return (
    <AdminForm action={saveTranslations} submitLabel="Save this page">
      <input type="hidden" name="code" value={code} />
      <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map((r) => {
          const long = r.source.length > 70 || r.value.length > 70;
          return (
            <div key={r.key} className="grid gap-2 p-3 sm:grid-cols-2 sm:gap-4">
              <input type="hidden" name="keys" value={r.key} />
              <div className="min-w-0"><code className="block truncate text-[11px] text-muted" title={r.key}>{r.key}</code><p className="mt-0.5 break-words text-sm">{r.source}</p></div>
              {long
                ? <textarea name={`t:${r.key}`} defaultValue={r.edited ? r.value : ""} placeholder={r.value} dir={dir} rows={3} className="field" aria-label={`${r.key} translation`} />
                : <input name={`t:${r.key}`} defaultValue={r.edited ? r.value : ""} placeholder={r.value} dir={dir} className="field" aria-label={`${r.key} translation`} />}
            </div>
          );
        })}
      </div>
    </AdminForm>
  );
}
