import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureSchema();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const db = getEnv().DB;
  const [p, c, pg] = await Promise.all([
    db.prepare("SELECT slug, updated_at FROM products WHERE status='published' ORDER BY updated_at DESC LIMIT 5000").all<{ slug: string; updated_at: number }>(),
    db.prepare("SELECT slug FROM categories WHERE active=1").all<{ slug: string }>(),
    db.prepare("SELECT slug FROM pages WHERE published=1").all<{ slug: string }>(),
  ]);
  return [
    { url: `${origin}/`, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...c.results.map((x) => ({ url: `${origin}/category/${x.slug}`, priority: 0.7 })),
    ...p.results.map((x) => ({ url: `${origin}/p/${x.slug}`, lastModified: new Date(x.updated_at), priority: 0.8 })),
    ...pg.results.map((x) => ({ url: `${origin}/page/${x.slug}`, priority: 0.3 })),
  ];
}
