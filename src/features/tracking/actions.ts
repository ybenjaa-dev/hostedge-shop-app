"use server";
import { revalidatePath } from "next/cache";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { retryFailedEvents, sendTestEvent } from "./capi";

export async function sendTestEventAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const platform = fd(form, "platform") === "tiktok" ? "tiktok" : "meta";
    const r = await sendTestEvent(platform);
    await audit(user, "tracking.test", "settings", platform);
    revalidatePath("/admin/settings");
    return r.ok ? { message: r.message } : { ok: false, error: r.message };
  });
}

export async function retryEventsAction(_p: ActionState, _form: FormData): Promise<ActionState> {
  void _form;
  return run("owner", async (user) => {
    const n = await retryFailedEvents(50);
    await audit(user, "tracking.retry", "settings", String(n));
    revalidatePath("/admin/settings");
    return { message: n ? `Retried ${n} failed event${n === 1 ? "" : "s"}` : "Nothing to retry" };
  });
}
