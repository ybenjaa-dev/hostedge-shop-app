"use client";
import { AdminForm } from "@/features/admin/components/admin-form";
import { importProductsAction } from "./actions";

export function ImportForm() {
  return (
    <AdminForm action={importProductsAction} submitLabel="Import">
      <input type="file" name="file" accept=".csv,text/csv" aria-label="CSV file" className="field" />
      <p className="text-center text-xs text-muted">or paste CSV</p>
      <textarea name="csv" rows={6} dir="ltr" className="field font-mono text-xs" aria-label="CSV text" />
    </AdminForm>
  );
}
