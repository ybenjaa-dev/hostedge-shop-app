import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { GOOGLE } from "./signals";
import { findBlock } from "./server";

/** Shop pages call this first: a blocked visitor (cookie, device, network or phone) is sent to Google instead of seeing the store. Staff are never blocked. */
export async function assertNotBlocked() {
  const h = await headers();
  if (!(await findBlock(h))) return;
  if (await getSessionUser()) return;
  redirect(GOOGLE);
}
