"use client";
import { BRAND } from "@/lib/brand";
import { useActionState, useState } from "react";
import { runSetup, type SetupState } from "@/features/admin/setup-actions";
import { SubmitButton } from "@/components/ui/submit";
import { COUNTRIES } from "@/lib/phone";
import { CURRENCIES } from "@/lib/money";

export function SetupForm() {
  const [state, action] = useActionState<SetupState, FormData>(runSetup, undefined);
  const [country, setCountry] = useState("MA");
  const [currency, setCurrency] = useState("MAD");
  const err = (k: string) => state?.fields?.[k];
  return (
    <form action={action} className="space-y-8">
      {state?.error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{state.error}</p>}
      <fieldset className="space-y-4">
        <legend className="display mb-1 text-lg font-extrabold">1 · Your store</legend>
        <div>
          <label className="label" htmlFor="storeName">Store name</label>
          <input id="storeName" name="storeName" className="field" required minLength={2} autoFocus aria-invalid={!!err("storeName")} defaultValue={BRAND.name === "My Store" ? undefined : BRAND.name} placeholder="e.g. Atlas Home" />
          {err("storeName") && <p className="err">{err("storeName")}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="country">Country</label>
            <select id="country" name="country" className="field" value={country} onChange={(e) => { setCountry(e.target.value); const c = COUNTRIES.find((x) => x.code === e.target.value); if (c) setCurrency(c.currency); }}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name.en} (+{c.dial})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="currency">Currency</label>
            <select id="currency" name="currency" className="field" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} — {v.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="language">Default language</label>
          <select id="language" name="language" className="field" defaultValue="fr">
            <option value="fr">Français</option><option value="ar">العربية</option><option value="en">English</option>
          </select>
        </div>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="display mb-1 text-lg font-extrabold">2 · Owner account</legend>
        <div>
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" className="field" required autoComplete="name" aria-invalid={!!err("name")} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="field" required autoComplete="email" aria-invalid={!!err("email")} />
          {err("email") && <p className="err">{err("email")}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="field" required minLength={8} autoComplete="new-password" aria-invalid={!!err("password")} />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
          {err("password") && <p className="err">{err("password")}</p>}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="display mb-1 text-lg font-extrabold">3 · Sample data</legend>
        <label className="flex items-start gap-3 rounded-xl border border-line p-4">
          <input type="checkbox" name="sample" value="1" defaultChecked className="mt-1 size-5 accent-[var(--brand)]" />
          <span><span className="block font-semibold">Add sample products, reviews and a coupon</span><span className="text-sm text-muted">Great for a first look. You can delete everything later from the admin.</span></span>
        </label>
      </fieldset>
      <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Setting up your store…">Create my store</SubmitButton>
    </form>
  );
}
