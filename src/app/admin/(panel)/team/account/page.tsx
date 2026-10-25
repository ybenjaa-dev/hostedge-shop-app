import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { PageHeader, Panel } from "@/features/admin/components/ui";
import { changeOwnPassword } from "@/features/team/actions";

export const metadata = { title: "My password" };

export default async function AccountPage() {
  const u = await requireUser();
  return (
    <div className="max-w-md">
      <Link href={u.role === "owner" ? "/admin/team" : "/admin"} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />Back</Link>
      <PageHeader title="Change my password" sub={u.email} />
      <Panel>
        <AdminForm action={changeOwnPassword} submitLabel="Update password" resetOnSuccess>
          <Field label="Current password" htmlFor="pw-cur"><input id="pw-cur" name="current" type="password" required autoComplete="current-password" className="field" /></Field>
          <Field label="New password" htmlFor="pw-new" hint="At least 8 characters."><input id="pw-new" name="next" type="password" required minLength={8} autoComplete="new-password" className="field" /></Field>
          <Field label="Confirm new password" htmlFor="pw-conf"><input id="pw-conf" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" /></Field>
        </AdminForm>
      </Panel>
    </div>
  );
}
