"use client";
import { AdminForm } from "@/features/admin/components/admin-form";
import { importTranslations } from "../actions";

export function ImportForm({ code }: { code: string }) {
  return (
    <AdminForm action={importTranslations} submitLabel="Import" resetOnSuccess className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="code" value={code} />
      <input type="file" name="file" accept=".csv,text/csv" required className="field !py-2" aria-label="Translated CSV file" />
    </AdminForm>
  );
}
