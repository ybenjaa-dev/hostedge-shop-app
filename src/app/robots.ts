import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/setup", "/order", "/checkout", "/cart"] }], sitemap: `${origin}/sitemap.xml` };
}
