"use client";
import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import type { ActionState } from "@/features/admin/run";
import { inviteUser } from "../actions";

export function InviteForm() {
  const [link, setLink] = useState<{ url: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const onDone = useCallback((s: ActionState) => {
    if (s?.ok && !s.error && s.fields?.path) { setLink({ url: `${window.location.origin}${s.fields.path}`, email: s.fields.email ?? "" }); setCopied(false); }
  }, []);
  return (
    <div className="space-y-4">
      <AdminForm action={inviteUser} submitLabel="Create invite link" onDone={onDone} resetOnSuccess className="grid items-end gap-4 sm:grid-cols-[2fr_1fr_auto]">
        <Field label="Email" htmlFor="inv-email"><input id="inv-email" name="email" type="email" required autoComplete="off" className="field" dir="ltr" /></Field>
        <Field label="Role" htmlFor="inv-role"><select id="inv-role" name="role" className="field" defaultValue="staff"><option value="staff">Staff</option><option value="owner">Owner</option></select></Field>
      </AdminForm>
      {link && (
        <div role="status" className="rounded-xl border border-brand/40 bg-brand-soft p-4">
          <p className="text-sm font-bold">Invite link for {link.email} — valid for 72 hours. Copy it now; it will not be shown again.</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={link.url} onFocus={(e) => e.currentTarget.select()} aria-label="Invite link" dir="ltr" className="field num text-sm" />
            <button type="button" className="btn btn-primary shrink-0" onClick={async () => { try { await navigator.clipboard.writeText(link.url); setCopied(true); } catch { setCopied(false); } }}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? "Copied" : "Copy link"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
