"use server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { getSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/phone";
import { refresh, fail } from "@/features/settings/lib";

/** Accepts a number typed locally, with +, or already in E.164 digits for any supported country. */
async function toE164(input: string): Promise<string | null> {
  const country = (await getSettings()).store.country;
  let r = normalizePhone(input, country);
  if (!r.ok && /^\d{8,15}$/.test(input.trim())) r = normalizePhone("+" + input.trim(), country);
  return r.ok ? r.e164 : null;
}

export async function blockPhone(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const phone = await toE164(fd(form, "phone"));
    if (!phone) return fail("Enter a valid phone number (include the country code if it is not local).");
    const reason = fd(form, "reason").slice(0, 200);
    await getDb().insert(schema.blockedPhones).values({ phone, reason: reason || null }).onConflictDoUpdate({ target: schema.blockedPhones.phone, set: { reason: reason || null } });
    await audit(user, "phone.block", "phone", phone, { reason });
    refresh();
    return { message: "Number blocked — it can no longer place orders" };
  });
}

export async function unblockPhone(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const phone = fd(form, "phone");
    if (!/^\d{6,16}$/.test(phone)) return fail("Invalid number");
    await getDb().delete(schema.blockedPhones).where(eq(schema.blockedPhones.phone, phone));
    await audit(user, "phone.unblock", "phone", phone);
    refresh();
    return { message: "Number unblocked" };
  });
}

export async function markAbandonedDone(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("staff", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing record");
    await getDb().update(schema.abandonedOrders).set({ recovered: true }).where(eq(schema.abandonedOrders.id, id));
    await audit(user, "abandoned.done", "abandoned", id);
    refresh();
    return { message: "Marked as done" };
  });
}
