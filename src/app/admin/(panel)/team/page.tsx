import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { KeyRound } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { Avatar } from "@/components/avatar";
import { Badge, Empty, PageHeader, Panel } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { nowMs } from "@/features/settings/lib";
import { ActionButton } from "@/features/settings/components/action-button";
import { InviteForm } from "@/features/team/components/invite-form";
import { revokeInvite, setUserActive } from "@/features/team/actions";
import { RoleSelect } from "@/features/team/components/role-select";
import { ROLES, ROLE_INFO, can, type Perm } from "@/lib/permissions";

export const metadata = { title: "Team" };
const MATRIX: [string, Perm][] = [["Dashboard & reports", "dashboard.view"], ["See orders", "orders.view"], ["Confirm / cancel orders (phone call)", "orders.confirm"], ["Pack & ship, carriers, tracking", "orders.fulfil"], ["Export orders (CSV)", "orders.export"], ["COD cash & remittances", "cash.manage"], ["Customers & blocklist", "customers.view"], ["Edit products", "products.edit"], ["Media library", "media.manage"], ["Coupons", "coupons.manage"], ["Appearance & pages", "appearance.edit"], ["Team performance", "performance.view"]];

export default async function TeamPage() {
  const me = await requireOwner();
  const db = getDb();
  const [users, invites] = await Promise.all([
    db.select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role, active: schema.users.active, avatar: schema.users.avatar, jobTitle: schema.users.jobTitle, createdAt: schema.users.createdAt }).from(schema.users).orderBy(asc(schema.users.createdAt)),
    db.select({ id: schema.invites.id, email: schema.invites.email, role: schema.invites.role, expiresAt: schema.invites.expiresAt }).from(schema.invites).orderBy(desc(schema.invites.createdAt)),
  ]);
  const now = nowMs();
  return (
    <div className="space-y-6">
      <PageHeader title="Team" sub="Invite staff and owners, manage access." actions={<Link href="/admin/team/account" className="btn btn-outline btn-sm"><KeyRound className="size-4" aria-hidden />My profile</Link>} />
      <Panel title="Invite a teammate"><InviteForm /></Panel>
      <DataTable head={["User", "Role", "Status", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <Td><div className="flex items-center gap-3"><Avatar name={u.name} src={u.avatar} size="md" /><div className="min-w-0"><div className="font-semibold">{u.name}{u.id === me.id && <span className="ms-2 text-xs font-normal text-muted">(you)</span>}</div><div className="text-xs text-muted">{u.jobTitle ? `${u.jobTitle} · ` : ""}<span dir="ltr">{u.email}</span></div></div></div></Td>
            <Td><RoleSelect id={u.id} role={u.role} name={u.name} /></Td>
            <Td>{u.active ? <Badge color="#16a34a">Active</Badge> : <Badge>Deactivated</Badge>}</Td>
            <Td><div className="flex flex-wrap justify-end gap-2">
              {u.active
                ? <ActionButton action={setUserActive} fields={{ id: u.id, active: "0" }} confirm={`Deactivate ${u.name}? They will be signed out.`} className="btn btn-ghost btn-sm text-danger" title={u.id === me.id ? "You cannot deactivate yourself" : undefined}>Deactivate</ActionButton>
                : <ActionButton action={setUserActive} fields={{ id: u.id, active: "1" }}>Reactivate</ActionButton>}
            </div></Td>
          </tr>
        ))}
      </DataTable>
      <Panel title="What each role can do">
        <p className="mb-3 text-sm text-muted">Give people only what they need: a confirmer can’t see money, an accountant can’t change an order.</p>
        <DataTable minWidth="44rem" head={["Area", ...ROLES.map((r) => ({ label: ROLE_INFO[r].label, center: true }))]}>
          {MATRIX.map(([label, perm]) => (
            <tr key={label}><Td className="font-semibold">{label}</Td>{ROLES.map((r) => <Td key={r} className="is-center">{r === "owner" || can(r, perm) ? <span className="font-extrabold text-ok" aria-label="Allowed">✓</span> : <span className="text-line" aria-label="Not allowed">—</span>}</Td>)}</tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Pending invites">
        {invites.length === 0 ? <Empty title="No pending invites" /> : (
          <ul className="divide-y divide-line">{invites.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold" dir="ltr">{i.email}</span><span className="text-xs text-muted">{ROLE_INFO[i.role]?.label ?? i.role} · {i.expiresAt < now ? "expired" : `expires ${new Date(i.expiresAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}</span></span>
              {i.expiresAt < now && <Badge color="#dc2626">Expired</Badge>}
              <ActionButton action={revokeInvite} fields={{ id: i.id }} confirm={`Revoke the invite for ${i.email}?`} className="btn btn-ghost btn-sm text-danger">Revoke</ActionButton>
            </li>
          ))}</ul>
        )}
      </Panel>
    </div>
  );
}
