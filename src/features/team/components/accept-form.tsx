"use client";
import { useActionState } from "react";
import { acceptInvite } from "../accept-actions";
import type { ActionState } from "@/features/admin/run";
import { SubmitButton } from "@/components/ui/submit";

export function AcceptForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState<ActionState, FormData>(acceptInvite, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">{state.error}</p>}
      <input type="hidden" name="token" value={token} />
      <div><label className="label" htmlFor="ai-email">Email</label><input id="ai-email" value={email} readOnly className="field bg-sunken" dir="ltr" /></div>
      <div><label className="label" htmlFor="ai-name">Your name</label><input id="ai-name" name="name" required minLength={2} maxLength={60} autoComplete="name" autoFocus className="field" /></div>
      <div><label className="label" htmlFor="ai-pw">Password</label><input id="ai-pw" name="password" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="field" /><p className="mt-1 text-xs text-muted">At least 8 characters.</p></div>
      <div><label className="label" htmlFor="ai-pw2">Confirm password</label><input id="ai-pw2" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" /></div>
      <SubmitButton className="btn btn-primary w-full" pendingText="Creating account…">Create account</SubmitButton>
    </form>
  );
}
