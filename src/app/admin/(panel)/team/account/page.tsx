import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { Badge, PageHeader, Panel } from "@/features/admin/components/ui";
import { Tabs } from "@/features/settings/components/tabs";
import { one } from "@/features/settings/lib";
import { changeOwnPassword } from "@/features/team/actions";
import { ProfileForm } from "@/features/team/components/profile-form";
import { ROLE_INFO } from "@/lib/permissions";

export const metadata = { title: "My profile" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const u = await requireUser();
  const tab = one((await searchParams).tab) === "password" ? "password" : "profile";
  const row = await getDb().select().from(schema.users).where(eq(schema.users.id, u.id)).get();
  const info = ROLE_INFO[u.role];
  return (
    <div className="max-w-3xl">
      <Link href={u.role === "owner" ? "/admin/team" : "/admin"} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />Back</Link>
      <PageHeader title="My profile" sub={u.email} actions={<Badge color={info.color}>{info.label}</Badge>} />
      <Tabs base="/admin/team/account" current={tab} items={[{ id: "profile", label: "Profile" }, { id: "password", label: "Password" }]} />
      {tab === "profile" ? (
        <Panel>
          <ProfileForm p={{ name: u.name, email: u.email, phone: row?.phone ?? "", jobTitle: row?.jobTitle ?? "", bio: row?.bio ?? "", avatar: row?.avatar ?? "" }} />
          <p className="mt-4 border-t border-line pt-3 text-xs text-muted">{info.blurb}{row?.createdAt ? ` · Member since ${new Date(row.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}` : ""}</p>
        </Panel>
      ) : (
        <Panel title="Change my password">
          <AdminForm action={changeOwnPassword} submitLabel="Update password" resetOnSuccess className="max-w-md space-y-5">
            <Field label="Current password" htmlFor="pw-cur"><input id="pw-cur" name="current" type="password" required autoComplete="current-password" className="field" /></Field>
            <Field label="New password" htmlFor="pw-new" hint="At least 8 characters."><input id="pw-new" name="next" type="password" required minLength={8} autoComplete="new-password" className="field" /></Field>
            <Field label="Confirm new password" htmlFor="pw-conf"><input id="pw-conf" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" /></Field>
          </AdminForm>
        </Panel>
      )}
    </div>
  );
}
