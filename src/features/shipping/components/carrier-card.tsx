"use client";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, ExternalLink, FileSpreadsheet, KeyRound, Plug } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { Badge } from "@/features/admin/components/ui";
import { saveCredentialsAction, testConnectionAction, toggleCarrierAction } from "../actions";
import type { PublicField } from "../credentials-core";

export type CarrierCardProps = {
  id: string; name: string; hasApi: boolean; countries: string[]; docsUrl: string; csvVerified: boolean;
  enabled: boolean; configured: boolean; fields: PublicField[]; owner: boolean;
};

/** One field: secrets are write-only. Configured secrets show a masked tail and a Replace button; the value is never sent to the browser. */
function CredField({ f }: { f: PublicField }) {
  const [replace, setReplace] = useState(false);
  const name = `cred.${f.key}`;
  if (f.secret && f.configured && !replace) {
    return (
      <Field label={f.label}>
        <div className="flex items-center gap-2">
          <span className="field flex items-center gap-2 font-semibold text-ok"><CheckCircle2 className="size-4" /> Configured <span className="num text-muted">{f.display}</span></span>
          <button type="button" className="btn btn-outline btn-sm shrink-0" onClick={() => setReplace(true)}>Replace</button>
        </div>
      </Field>
    );
  }
  return (
    <Field label={f.label} hint={f.hint ?? (f.secret && f.configured ? "Leave blank to keep the current value" : undefined)}>
      <input name={name} type={f.secret ? "password" : "text"} autoComplete="off" spellCheck={false} className="field" defaultValue={f.secret ? "" : f.display} placeholder={f.secret ? "Enter value" : ""} />
    </Field>
  );
}

export function CarrierCard(p: CarrierCardProps) {
  return (
    <section className="card p-4 sm:p-5" aria-label={p.name}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="display flex flex-wrap items-center gap-2 text-lg font-extrabold">
            {p.name}
            {p.hasApi ? <Badge color="#16a34a">API</Badge> : <Badge color="#64748b">Export only</Badge>}
          </h3>
          <p className="mt-1 text-xs text-muted">{p.countries.join(" · ")}{p.docsUrl && <> · <a className="inline-flex items-center gap-0.5 underline" href={p.docsUrl} target="_blank" rel="noreferrer noopener">Website <ExternalLink className="size-3" /></a></>}</p>
        </div>
        {p.owner ? (
          <AdminForm action={toggleCarrierAction} hideSubmit className="shrink-0">
            <input type="hidden" name="carrierId" value={p.id} />
            <ToggleSubmit enabled={p.enabled} />
          </AdminForm>
        ) : (
          <Badge color={p.enabled ? "#16a34a" : "#64748b"}>{p.enabled ? "Enabled" : "Disabled"}</Badge>
        )}
      </div>

      {!p.hasApi ? (
        <div className="mt-4 space-y-2 rounded-xl bg-sunken p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="size-4" /> CSV export + manual tracking number</p>
          <p className="text-muted">{p.csvVerified ? "Template matches the carrier's bulk-import format." : "Uses a generic COD template: format unverified. Check the column names against your carrier's import file before uploading."}</p>
        </div>
      ) : p.owner ? (
        <div className="mt-4 space-y-4">
          <AdminForm action={saveCredentialsAction} submitLabel="Save credentials" className="space-y-3">
            <input type="hidden" name="carrierId" value={p.id} />
            <p className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4" /> Credentials {p.configured && <Badge color="#16a34a">Configured</Badge>}</p>
            {p.fields.map((f) => <CredField key={f.key} f={f} />)}
          </AdminForm>
          <AdminForm action={testConnectionAction} submitLabel="Test connection" className="flex items-center gap-2">
            <input type="hidden" name="carrierId" value={p.id} />
            <Plug className="size-4 text-muted" aria-hidden />
          </AdminForm>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Only the owner can edit credentials.</p>
      )}
    </section>
  );
}

function ToggleSubmit({ enabled }: { enabled: boolean }) {
  // Submit via a real checkbox-like switch: clicking submits the opposite state.
  const { pending } = useFormStatus();
  return (
    <>
      <input type="hidden" name="enabled" value={enabled ? "" : "1"} />
      <button type="submit" disabled={pending} role="switch" aria-checked={enabled} aria-label={enabled ? "Disable carrier" : "Enable carrier"} className={`relative h-7 w-12 rounded-full transition disabled:opacity-60 ${enabled ? "bg-brand" : "bg-line"}`}>
        <span aria-hidden className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-all ${enabled ? "start-[1.4rem]" : "start-0.5"}`} />
      </button>
    </>
  );
}
