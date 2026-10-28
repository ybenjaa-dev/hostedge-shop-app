import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ensureSchema } from "@/db/ensure-schema";
import { sha256Hex } from "@/lib/crypto";
import { getSettings } from "@/lib/settings";
import { nowMs } from "@/features/settings/lib";
import { AcceptForm } from "@/features/team/components/accept-form";

export const metadata = { title: "Accept invitation", robots: { index: false, follow: false } };

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await ensureSchema();
  const s = await getSettings();
  const inv = /^[A-Za-z0-9_-]{20,100}$/.test(token) ? await getDb().select().from(schema.invites).where(eq(schema.invites.id, await sha256Hex(token))).get() : undefined;
  const valid = !!inv && inv.expiresAt > nowMs();
  return (
    <main className="grid min-h-dvh place-items-center bg-sunken px-4 py-8">
      <div className="card w-full max-w-sm p-7 shadow-xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand">{s.store.name}</p>
        {valid ? (
          <>
            <h1 className="display mb-1 mt-1 text-3xl font-extrabold">Join the team</h1>
            <p className="mb-6 text-sm text-muted">You were invited as <b className="capitalize">{inv.role}</b>. Set your name and a password to continue.</p>
            <AcceptForm token={token} email={inv.email} />
          </>
        ) : (
          <>
            <h1 className="display mb-2 mt-1 text-2xl font-extrabold">Invitation not valid</h1>
            <p className="mb-6 text-sm text-muted">This link has expired, was already used, or was revoked. Ask the store owner for a new invitation.</p>
            <Link href="/admin/login" className="btn btn-outline w-full">Go to sign in</Link>
          </>
        )}
      </div>
    </main>
  );
}
