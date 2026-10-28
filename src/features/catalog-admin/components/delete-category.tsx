"use client";
import { useState } from "react";
import type { ActionState } from "@/features/admin/run";
import { ActionButton } from "@/features/settings/components/action-button";

/** Delete a category; when it has products, the admin picks where to move them. */
export function DeleteCategory({ id, name, count, others, action }: { id: string; name: string; count: number; others: { id: string; name: string }[]; action: (p: ActionState, f: FormData) => Promise<ActionState> }) {
  const [to, setTo] = useState("");
  if (count === 0) return <ActionButton action={action} fields={{ id }} confirm={`Delete “${name}”?`} className="btn btn-ghost btn-sm text-danger">Delete category</ActionButton>;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-sunken/50 p-3">
      <div className="min-w-48 flex-1"><label className="label" htmlFor={`mv-${id}`}>{count} product{count > 1 ? "s" : ""} will move to</label>
        <select id={`mv-${id}`} className="field" value={to} onChange={(e) => setTo(e.target.value)}><option value="">No category</option>{others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
      <ActionButton action={action} fields={{ id, mode: "reassign", reassign: to }} confirm={`Delete “${name}” and move its ${count} product(s)?`} className="btn btn-danger btn-sm">Reassign &amp; delete</ActionButton>
    </div>
  );
}
