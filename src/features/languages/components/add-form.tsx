"use client";
import { useState } from "react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { LANG_PRESETS, flagEmoji } from "@/lib/lang-presets";
import { addLanguage } from "../actions";

export function AddLanguageForm({ existing }: { existing: string[] }) {
  const [preset, setPreset] = useState("");
  const options = LANG_PRESETS.filter((p) => !existing.includes(p.code));
  return (
    <AdminForm action={addLanguage} submitLabel="Add language" resetOnSuccess onDone={() => setPreset("")} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Choose a language" htmlFor="lp">
          <select id="lp" name="preset" value={preset} onChange={(e) => setPreset(e.target.value)} className="field">
            <option value="">Other (enter the details yourself)…</option>
            {options.map((p) => <option key={p.code} value={p.code}>{flagEmoji(p.flag)} {p.native} — {p.name}</option>)}
          </select>
        </Field>
        <Field label="Start from" htmlFor="lc" hint="Texts you haven't translated yet show in this language.">
          <select id="lc" name="copyFrom" defaultValue="en" className="field"><option value="en">English</option><option value="fr">Français</option><option value="ar">العربية</option></select>
        </Field>
      </div>
      {!preset && (
        <div className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Code" htmlFor="lcode" hint="2 letters, e.g. es"><input id="lcode" name="code" maxLength={2} pattern="[a-zA-Z]{2}" dir="ltr" className="field uppercase" required={!preset} /></Field>
          <Field label="Name in English" htmlFor="lname"><input id="lname" name="name" maxLength={40} className="field" placeholder="Spanish" required={!preset} /></Field>
          <Field label="Name in the language" htmlFor="lnative"><input id="lnative" name="native" maxLength={40} className="field" placeholder="Español" required={!preset} /></Field>
          <Field label="Direction" htmlFor="ldir"><select id="ldir" name="dir" className="field"><option value="ltr">Left to right</option><option value="rtl">Right to left</option></select></Field>
          <Field label="Flag (country code)" htmlFor="lflag" hint="e.g. ES"><input id="lflag" name="flag" maxLength={2} dir="ltr" className="field uppercase" /></Field>
        </div>
      )}
    </AdminForm>
  );
}
