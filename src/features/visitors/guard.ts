import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureSchema } from "@/db/ensure-schema";
import { isVisitorBlocked } from "./server";

/** Shop pages call this first: a blocked device (or blocked customer) is sent to the "no access" page instead of seeing the store. */
export async function assertNotBlocked() {
  const vid = (await cookies()).get("he_vid")?.value;
  if (!vid) return;
  await ensureSchema();
  if (await isVisitorBlocked(vid)) redirect("/blocked");
}
