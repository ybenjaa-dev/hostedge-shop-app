import { enabledLangs, sitemapIndexXml, sitemapXml } from "@/lib/sitemap";

export const dynamic = "force-dynamic";
const origin = (req: Request) => `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;
const H = { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" };

/** With language URLs on this is an index of one sitemap per language; otherwise a single flat sitemap. */
export async function GET(req: Request) {
  const { langs, on } = await enabledLangs();
  return new Response(on ? sitemapIndexXml(origin(req), langs) : await sitemapXml(origin(req), null), { headers: H });
}
