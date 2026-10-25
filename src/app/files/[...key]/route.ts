import { getEnv } from "@/lib/env";

// Public file serving — only the uploads/ prefix is public (labels/ are admin-only).
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key.startsWith("uploads/") || key.includes("..")) return new Response("Not found", { status: 404 });
  const etag = `"${key}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  let obj = await getEnv().FILES.get(key);
  // a missing compressed variant (older upload) falls back to the full-size file
  if (!obj && /-(thumb|md)\.webp$/.test(key)) obj = await getEnv().FILES.get(key.replace(/-(thumb|md)\.webp$/, ".webp"));
  if (!obj) return new Response("Not found", { status: 404 });
  const h = new Headers();
  h.set("Content-Type", obj.httpMetadata?.contentType ?? "application/octet-stream");
  h.set("Cache-Control", "public, max-age=31536000, immutable");
  h.set("ETag", etag);
  h.set("X-Content-Type-Options", "nosniff");
  return new Response(obj.body, { headers: h });
}
