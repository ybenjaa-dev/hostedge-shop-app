"use server";
import { getEnv } from "@/lib/env";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { fail, refresh } from "@/features/settings/lib";

/** Stop a device (by fingerprint) from placing orders. */
export async function blockFingerprint(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("customers.block", async (user) => {
    const fp = fd(form, "fp");
    if (!/^[a-f0-9]{16,64}$/.test(fp)) return fail("This visitor has no device fingerprint (they did not accept the privacy notice).");
    await getEnv().DB.prepare("INSERT INTO blocked_fingerprints (fp, reason, created_at) VALUES (?,?,?) ON CONFLICT(fp) DO UPDATE SET reason = excluded.reason").bind(fp, fd(form, "reason").slice(0, 200) || null, Date.now()).run();
    await audit(user, "device.block", "fingerprint", fp);
    refresh();
    return { message: "Device blocked — it can no longer place orders" };
  });
}

export async function unblockFingerprint(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("customers.block", async (user) => {
    const fp = fd(form, "fp");
    if (!/^[a-f0-9]{16,64}$/.test(fp)) return fail("Invalid device");
    await getEnv().DB.prepare("DELETE FROM blocked_fingerprints WHERE fp = ?").bind(fp).run();
    await audit(user, "device.unblock", "fingerprint", fp);
    refresh();
    return { message: "Device unblocked" };
  });
}
