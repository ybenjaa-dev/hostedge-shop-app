import { requirePerm } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings } from "@/lib/settings";
import { fileUrl } from "@/lib/storage";
import { PageHeader, Panel, Empty, Badge } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { ActionButton } from "@/features/settings/components/action-button";
import { PushCompose } from "@/features/push/components/compose";
import { getVapid } from "@/features/push/server";
import { continuePushAction } from "@/features/push/actions";

export const metadata = { title: "Push notifications" };

export default async function PushPage() {
  await requirePerm("push.send");
  await ensureSchema();
  await getVapid();
  const db = getEnv().DB;
  const s = await getSettings();
  const [tot, countries, cities, msgs] = await db.batch([
    db.prepare("SELECT COUNT(*) AS n FROM push_subscriptions WHERE active = 1"),
    db.prepare("SELECT DISTINCT country AS v FROM push_subscriptions WHERE active = 1 AND country IS NOT NULL ORDER BY 1 LIMIT 60"),
    db.prepare("SELECT city AS v, COUNT(*) AS n FROM push_subscriptions WHERE active = 1 AND city IS NOT NULL GROUP BY city ORDER BY n DESC LIMIT 80"),
    db.prepare("SELECT id, title, body, status, targeted, delivered, failed, clicks, created_by AS by, created_at AS at FROM push_messages ORDER BY created_at DESC LIMIT 20"),
  ]);
  const total = (tot!.results[0] as { n: number }).n;
  const iconKey = s.branding.favicon || s.branding.logo;
  const rows = msgs!.results as { id: string; title: string; body: string; status: string; targeted: number; delivered: number; failed: number; clicks: number; by: string; at: number }[];
  return (
    <div>
      <PageHeader title="Push notifications" sub={`${total} device${total === 1 ? "" : "s"} subscribed`} />
      {!s.engage.push && <p className="mb-4 rounded-xl bg-warn/10 p-3 text-sm font-medium">Push is switched off — turn it on in Settings → App &amp; push so visitors can subscribe.</p>}
      <div className="space-y-6">
        <Panel title="New message">
          <PushCompose total={total} countries={(countries!.results as { v: string }[]).map((r) => r.v)} cities={(cities!.results as { v: string }[]).map((r) => r.v)} brand={{ name: s.store.name, icon: iconKey ? fileUrl(iconKey, "thumb") : "" }} />
        </Panel>
        <Panel title="History">
          {rows.length === 0 ? <Empty title="Nothing sent yet" hint="Visitors who accept notifications on the shop appear above as subscribers." /> : (
            <DataTable minWidth="44rem" head={["Message", "Sent", "Delivered", "Failed", "Opened", ""]}>
              {rows.map((m) => (
                <tr key={m.id}>
                  <Td><b>{m.title}</b><div className="max-w-xs truncate text-xs text-muted">{m.body}</div></Td>
                  <Td className="num whitespace-nowrap text-muted">{new Date(m.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}<div className="text-xs">{m.by}</div></Td>
                  <Td className="num">{m.delivered}/{m.targeted}</Td>
                  <Td className={`num ${m.failed ? "text-danger" : "text-muted"}`}>{m.failed}</Td>
                  <Td className="num">{m.clicks}{m.delivered ? <span className="text-xs text-muted"> ({Math.round((m.clicks / m.delivered) * 100)}%)</span> : null}</Td>
                  <Td>{m.status === "sending" ? <div className="flex items-center justify-end gap-2"><Badge color="#d97706">Sending</Badge><ActionButton action={continuePushAction} fields={{ id: m.id }}>Continue</ActionButton></div> : null}</Td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>
      </div>
    </div>
  );
}
