import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { allLangs } from "@/lib/i18n-core";
import { ensureLangs } from "@/lib/languages";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers(); // reading headers makes this dynamic, so nothing hits the database at build time
  await ensureLangs();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/setup", "/order", "/checkout", "/cart", "/offline", ...allLangs().flatMap((l) => [`/${l}/order`, `/${l}/checkout`, `/${l}/cart`])] }], sitemap: `${origin}/sitemap.xml` };
}
