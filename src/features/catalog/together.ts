"use server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { companions, type Companion } from "./links";

/** Public: the "frequently bought together" products for a product page. */
export async function getTogether(productId: string): Promise<Companion[]> {
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(productId)) return [];
  if (!(await rateLimit(`together:${await clientIp()}`, 120, 60)).ok) return [];
  return companions(productId, "together", 3);
}
