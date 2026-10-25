import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { blockPhone } from "../actions";

export function BlockForm() {
  return (
    <AdminForm action={blockPhone} submitLabel="Block number" resetOnSuccess className="grid items-end gap-4 sm:grid-cols-[1fr_1.5fr_auto]">
      <Field label="Phone number" htmlFor="bl-phone"><input id="bl-phone" name="phone" required inputMode="tel" dir="ltr" placeholder="0612345678 or +212…" className="field" /></Field>
      <Field label="Reason (optional)" htmlFor="bl-reason"><input id="bl-reason" name="reason" maxLength={200} className="field" /></Field>
    </AdminForm>
  );
}
