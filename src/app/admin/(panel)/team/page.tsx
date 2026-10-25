import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { KeyRound } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { Badge, Empty, PageHeader, Panel } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { nowMs } from "@/features/settings/lib";
import { ActionButton } from "@/features/settings/components/action-button";
import { InviteForm } from "@/features/team/components/invite-form";
import { revokeInvite, setUserActive, setUserRole } from "@/features/team/actions";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireOwner();
  const db = getDb();
  const [users, invites] = await Promise.all([
    db.select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, active: schema.users.active, createdAt: schema.users.createdAt }).from(schema.users).orderBy(asc(schema.users.createdAt)),
    db.select({ id: schema.invites.id, email: schema.invites.email, role: schema.invites.role, expiresAt: schema.invites.expiresAt }).from(schema.invites).orderBy(desc(schema.invites.createdAt)),
  ]);
  const now = nowMs();
  return (
    <div className="space-y-6">
      <PageHeader title="Team" sub="Invite staff and owners, manage access." actions={<Link href="/admin/team/account" className="btn btn-outline btn-sm"><KeyRound className="size-4" aria-hidden />My password</Link>} />
      <Panel title="Invite a teammate"><InviteForm /></Panel>
      <DataTable head={["User", "Role", "Status", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td><div className="font-semibold">{u.name}{u.id === me.id && <span className="ms-2 text-xs font-normal text-muted">(you)</span>}</div><div className="text-xs text-muted" dir="ltr">{u.email}</div></Td>
            <Td><Badge color={u.role === "owner" ? "#7c3aed" : "#0d9488"}>{u.role}</Badge></Td>
            <Td>{u.active ? <Badge color="#16a34a">Active</Badge> : <Badge>Deactivated</Badge>}</Td>
            <Td><div className="flex flex-wrap justify-end gap-2">
              <ActionButton action={setUserRole} fields={{ id: u.id, role: u.role === "owner" ? "staff" : "owner" }} confirm={`Make ${u.name} ${u.role === "owner" ? "staff" : "an owner"}?`}>{u.role === "owner" ? "Make staff" : "Make owner"}</ActionButton>
              {u.active
                ? <ActionButton action={setUserActive} fields={{ id: u.id, active: "0" }} confirm={`Deactivate ${u.name}? They will be signed out.`} className="btn btn-ghost btn-sm text-danger" title={u.id === me.id ? "You cannot deactivate yourself" : undefined}>Deactivate</ActionButton>
                : <ActionButton action={setUserActive} fields={{ id: u.id, active: "1" }}>Reactivate</ActionButton>}
            </div></Td>
          </tr>
        ))}
      </DataTable>
      <Panel title="Pending invites">
        {invites.length === 0 ? <Empty title="No pending invites" /> : (
          <ul className="divide-y divide-line">{invites.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold" dir="ltr">{i.email}</span><span className="text-xs text-muted">{i.role} · {i.expiresAt < now ? "expired" : `expires ${new Date(i.expiresAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}</span></span>
              {i.expiresAt < now && <Badge color="#dc2626">Expired</Badge>}
              <ActionButton action={revokeInvite} fields={{ id: i.id }} confirm={`Revoke the invite for ${i.email}?`} className="btn btn-ghost btn-sm text-danger">Revoke</ActionButton>
            </li>
          ))}</ul>
        )}
      </Panel>
    </div>
  );
}
