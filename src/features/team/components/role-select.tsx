"use client";
import { useTransition } from "react";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";
import { ROLES, ROLE_INFO, type Role } from "@/lib/permissions";
import { setUserRole } from "../actions";

/** Change a teammate's role in place. */
export function RoleSelect({ id, role, name }: { id: string; role: Role; name: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const ask = useConfirm();
  return (
    <select aria-label={`Role of ${name}`} className="field !min-h-9 !w-auto !py-1 text-sm font-semibold" value={role} disabled={pending}
      onChange={async (e) => {
        const el = e.target, next = el.value;
        if (!(await ask({ title: "Change role", message: `Change ${name}’s role to ${ROLE_INFO[next as Role]?.label}?`, confirmLabel: "Change role", danger: false }))) { el.value = role; return; }
        start(async () => { const f = new FormData(); f.set("id", id); f.set("role", next); const r = await setUserRole(undefined, f); if (r?.error) toast("error", r.error); else toast("success", r?.message ?? "Role updated"); });
      }}>
      {ROLES.map((r) => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
    </select>
  );
}
