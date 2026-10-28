"use server";
import { getEnv } from "@/lib/env";
import { newId } from "@/lib/id";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { fail, refresh } from "@/features/settings/lib";
import { getInstallSecret } from "@/features/orders/service";
import { invalidateBlocks } from "./block-index";
import { FP_RE, VID_RE, ipuaHash, type SignalKind } from "./signals";

type V = { id: string; fp: string | null; ip: string | null; ua: string | null; phone: string | null };

async function findVisitor(vid: string, fp: string): Promise<V | null> {
  const db = getEnv().DB;
  const sel = "SELECT id, fp, ip, ua, phone FROM visitors";
  if (VID_RE.test(vid)) { const v = await db.prepare(`${sel} WHERE id = ?`).bind(vid).first<V>(); if (v) return v; }
  if (FP_RE.test(fp)) return db.prepare(`${sel} WHERE fp = ? ORDER BY last_seen DESC LIMIT 1`).bind(fp).first<V>();
  return null;
}

/** Block a visitor/device: records every signal we know for it (cookie id, fingerprint, IP + device class, phone). */
export async function blockFingerprint(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("customers.block", async (user) => {
    const fp = fd(form, "fp"), vid = fd(form, "vid"), reason = fd(form, "reason").slice(0, 200) || null;
    const v = await findVisitor(vid, fp);
    const fpv = FP_RE.test(fp) ? fp : v?.fp && FP_RE.test(v.fp) ? v.fp : null;
    if (!v && !fpv) return fail("Visitor not found.");
    const db = getEnv().DB, now = Date.now();
    const sigs: { kind: SignalKind; value: string }[] = [];
    if (v) sigs.push({ kind: "vid", value: v.id });
    if (fpv) sigs.push({ kind: "fp", value: fpv });
    const ipua = v ? await ipuaHash(v.ip, v.ua ?? "", await getInstallSecret()) : null;
    if (ipua) sigs.push({ kind: "ipua", value: ipua });
    if (v?.phone) sigs.push({ kind: "phone", value: v.phone });
    await db.batch([
      ...sigs.map((s) => db.prepare("INSERT INTO blocked_signals (id, kind, value, visitor_id, reason, created_at, hits) VALUES (?,?,?,?,?,?,0) ON CONFLICT(kind, value) DO UPDATE SET reason = excluded.reason, visitor_id = excluded.visitor_id").bind(newId(16), s.kind, s.value, v?.id ?? null, reason, now)),
      ...(fpv ? [db.prepare("INSERT INTO blocked_fingerprints (fp, reason, created_at) VALUES (?,?,?) ON CONFLICT(fp) DO UPDATE SET reason = excluded.reason").bind(fpv, reason, now)] : []),
    ]);
    invalidateBlocks();
    await audit(user, "device.block", "visitor", v?.id ?? fpv ?? "", { signals: sigs.map((s) => s.kind) });
    refresh();
    return { message: `Visitor blocked (${sigs.map((s) => s.kind).join(", ")}) — they are now sent to Google` };
  });
}

/** Remove every signal of this visitor, including the ones learned later, and the legacy fingerprint row. */
export async function unblockFingerprint(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("customers.block", async (user) => {
    const fp = fd(form, "fp"), vid = fd(form, "vid");
    const v = await findVisitor(vid, fp);
    const fps = [...new Set([FP_RE.test(fp) ? fp : null, v?.fp ?? null].filter((x): x is string => !!x))];
    if (!v && !fps.length) return fail("Visitor not found.");
    const db = getEnv().DB;
    await db.batch([
      ...(v ? [db.prepare("DELETE FROM blocked_signals WHERE visitor_id = ?").bind(v.id)] : []),
      ...fps.flatMap((f) => [db.prepare("DELETE FROM blocked_signals WHERE kind = 'fp' AND value = ?").bind(f), db.prepare("DELETE FROM blocked_fingerprints WHERE fp = ?").bind(f)]),
    ]);
    invalidateBlocks();
    await audit(user, "device.unblock", "visitor", v?.id ?? fps[0] ?? "");
    refresh();
    return { message: "Visitor unblocked" };
  });
}
