"use server";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { fail, refresh } from "@/features/settings/lib";
import { assertUser } from "@/lib/auth";
import { isLang } from "@/lib/i18n-core";
import { countAudience, createCampaign, sendCampaignBatch, type Audience } from "./server";

function audienceOf(form: FormData): Audience {
  const a: Audience = {};
  const lang = fd(form, "lang"), country = fd(form, "country").toUpperCase(), city = fd(form, "city"), ordered = fd(form, "ordered");
  if (isLang(lang)) a.lang = lang;
  if (/^[A-Z]{2}$/.test(country)) a.country = country;
  if (city) a.city = city.slice(0, 80);
  if (ordered === "yes" || ordered === "no") a.ordered = ordered;
  return a;
}

/** Live "N people will receive this" counter in the composer. */
export async function countAudienceAction(form: FormData): Promise<number> {
  try { await assertUser("push.send"); } catch { return 0; }
  return countAudience(audienceOf(form));
}

export async function sendPushAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("push.send", async (user) => {
    const title = fd(form, "title").slice(0, 80), body = fd(form, "body").slice(0, 200);
    let url = fd(form, "url").slice(0, 300);
    if (!title || !body) return fail("Add a title and a message.");
    if (url && !/^(\/[^\s]*|https?:\/\/[^\s]+)$/.test(url)) return fail("The link must start with / (a page of your store) or https://.");
    if (!url) url = "/";
    const audience = audienceOf(form);
    const { id, targeted } = await createCampaign({ title, body, url, image: fd(form, "image"), audience, createdBy: user.name || user.email });
    if (!targeted) return fail("Nobody matches this audience yet — nothing was sent.");
    const r = await sendCampaignBatch(id);
    await audit(user, "push.send", "push", id, { title, targeted });
    refresh();
    return { message: r.remaining ? `Sending… ${r.sent} delivered, ${r.remaining} still queued (continues automatically).` : `Sent to ${r.sent} device${r.sent === 1 ? "" : "s"}${r.failed ? `, ${r.failed} failed` : ""}.` };
  });
}

export async function continuePushAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("push.send", async () => {
    const id = fd(form, "id");
    if (!id) return fail("Missing message");
    const r = await sendCampaignBatch(id);
    refresh();
    return { message: r.remaining ? `${r.sent} more delivered, ${r.remaining} still queued.` : "All delivered." };
  });
}
