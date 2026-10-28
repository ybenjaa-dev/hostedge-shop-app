"use client";
import { AdminForm } from "@/features/admin/components/admin-form";
import { saveAbandonedNote } from "../actions";

export function NoteForm({ id, note }: { id: string; note: string }) {
  return (
    <AdminForm action={saveAbandonedNote} submitLabel="Save note" className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <textarea name="note" defaultValue={note} rows={4} maxLength={2000} className="field" aria-label="Internal note" placeholder="Internal note (never shown to the customer)" />
    </AdminForm>
  );
}
