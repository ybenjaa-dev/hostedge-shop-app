import { Download, FileJson, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { PageHeader, Panel } from "@/features/admin/components/ui";
import { BACKUP_TABLES, CSV_TABLES } from "@/features/settings/backup-tables";

export const metadata = { title: "Backup" };

export default async function BackupPage() {
  await requireOwner();
  await ensureSchema();
  const counts = await Promise.all(["orders", "customers", "products"].map(async (t) => [t, (await getEnv().DB.prepare(`SELECT count(*) AS n FROM "${t}"`).first<{ n: number }>())?.n ?? 0] as const));
  const n = Object.fromEntries(counts);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Backup & export" sub="Download your data. Exports never include passwords, sessions or carrier credentials." />
      <Panel title="Full backup (JSON)">
        <p className="mb-4 text-sm text-muted">Every table — {BACKUP_TABLES.length} in total — streamed as a single JSON file. Keep it somewhere safe.</p>
        <a href="/api/admin/backup?format=json" download className="btn btn-primary"><FileJson className="size-4" aria-hidden />Download full backup</a>
      </Panel>
      <Panel title="Spreadsheets (CSV)">
        <ul className="divide-y divide-line">
          {CSV_TABLES.map((t) => (
            <li key={t} className="flex flex-wrap items-center gap-3 py-3">
              <FileSpreadsheet className="size-5 text-muted" aria-hidden />
              <span className="flex-1"><span className="block font-semibold capitalize">{t}</span><span className="num text-xs text-muted">{n[t]} rows</span></span>
              <a href={`/api/admin/backup?format=csv&table=${t}`} download className="btn btn-outline btn-sm"><Download className="size-4" aria-hidden />Download CSV</a>
            </li>
          ))}
        </ul>
      </Panel>
      <p className="flex items-start gap-2 text-sm text-muted"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />Excluded for safety: password hashes, login sessions, invite tokens, carrier credentials and the install secret. Each export is recorded in the activity log.</p>
    </div>
  );
}
