import { enabledLangs, sitemapXml, isLang } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

/** /sitemap/ar.xml, /sitemap/fr.xml … */
export async function GET(req: Request, { params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang.replace(/\.xml$/, "");
  const { langs, on } = await enabledLangs();
  if (!on || !isLang(lang) || !langs.includes(lang)) return new Response("Not found", { status: 404 });
  const origin = `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host")}`;
  return new Response(await sitemapXml(origin, lang), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=600" } });
}
