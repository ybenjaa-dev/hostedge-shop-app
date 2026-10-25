"use client";
import { useActionState } from "react";
import { loginAction } from "@/features/admin/auth-actions";
import type { ActionState } from "@/features/admin/run";
import { SubmitButton } from "@/components/ui/submit";

export function LoginForm() {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">{state.error}</p>}
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoFocus autoComplete="username" className="field" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" className="field" /></div>
      <SubmitButton className="btn btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
    </form>
  );
}
