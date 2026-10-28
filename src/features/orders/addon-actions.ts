"use server";
import { redirect } from "next/navigation";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { applyAddon } from "./addon";

/** Public (the signed order token is the credential): add the offered product, then show the thank-you page. */
export async function addAddonAction(form: FormData): Promise<void> {
  const number = String(form.get("number") ?? ""), token = String(form.get("token") ?? ""), product = String(form.get("product") ?? "");
  if (!/^[0-9A-Za-z-]{1,20}$/.test(number) || !/^[a-f0-9]{24}$/.test(token) || !/^[A-Za-z0-9_-]{1,40}$/.test(product)) redirect("/");
  const done = `/order/${number}?t=${token}`;
  if (!(await rateLimit(`addon:${await clientIp()}`, 20, 600)).ok) redirect(done);
  const r = await applyAddon(number, token, product);
  redirect(r.ok ? `${done}&added=1${r.freeShipping ? "&free=1" : ""}` : done);
}
