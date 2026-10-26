import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings } from "@/lib/settings";
import { LANGS, isLang, type Lang } from "@/lib/i18n-core";

type Entry = { path: string; changefreq: string; priority: number; lastmod?: number };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function enabledLangs(): Promise<{ langs: Lang[]; def: Lang; on: boolean }> {
  const s = await getSettings();
  return { langs: LANGS.filter((l) => s.store.langs.includes(l)), def: s.store.defaultLang, on: s.engage.langUrls };
}

async function entries(): Promise<Entry[]> {
  await ensureSchema();
  const db = getEnv().DB;
  const [p, c, pg] = await Promise.all([
    db.prepare("SELECT slug, updated_at FROM products WHERE status='published' ORDER BY updated_at DESC LIMIT 5000").all<{ slug: string; updated_at: number }>(),
    db.prepare("SELECT slug FROM categories WHERE active=1").all<{ slug: string }>(),
    db.prepare("SELECT slug FROM pages WHERE published=1").all<{ slug: string }>(),
  ]);
  return [
    { path: "/", changefreq: "daily", priority: 1 },
    { path: "/shop", changefreq: "daily", priority: 0.9 },
    ...c.results.map((x) => ({ path: `/category/${x.slug}`, changefreq: "weekly", priority: 0.7 })),
    ...p.results.map((x) => ({ path: `/p/${x.slug}`, changefreq: "weekly", priority: 0.8, lastmod: x.updated_at })),
    ...pg.results.map((x) => ({ path: `/page/${x.slug}`, changefreq: "monthly", priority: 0.3 })),
  ];
}

const xml = (body: string, ns = "") => `<?xml version="1.0" encoding="UTF-8"?>\n${body.replace("<urlset", `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${ns}`)}`;

/** `lang` = the language's own sitemap (every URL lists all its translations); null = one flat sitemap without language URLs. */
export async function sitemapXml(origin: string, lang: Lang | null): Promise<string> {
  const { langs } = await enabledLangs();
  const list = await entries();
  const loc = (l: Lang | null, path: string) => `${origin}${l ? `/${l}${path === "/" ? "" : path}` : path}`;
  const urls = list.map((e) => {
    const alt = lang ? langs.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(loc(l, e.path))}"/>`).join("") : "";
    return `<url><loc>${esc(loc(lang, e.path))}</loc>${e.lastmod ? `<lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ""}<changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority>${alt}</url>`;
  }).join("");
  return xml(`<urlset>${urls}</urlset>`, lang ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : "");
}

export function sitemapIndexXml(origin: string, langs: Lang[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${langs.map((l) => `<sitemap><loc>${esc(`${origin}/sitemap/${l}.xml`)}</loc></sitemap>`).join("")}</sitemapindex>`;
}
export { isLang };
