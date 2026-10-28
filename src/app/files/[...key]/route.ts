import { getEnv } from "@/lib/env";
import { snapWidth, storedVariantFor } from "@/lib/image-sizes";

const IMMUTABLE = "public, max-age=31536000, immutable";

/**
 * Public file serving — only the uploads/ prefix is public (labels/ are admin-only).
 * `?w=640` asks for a width: the nearest stored size is served, and when the Cloudflare Images binding is available the file is
 * resized and converted to AVIF/WebP on the fly (cached at the edge). Without the binding nothing breaks — it just serves stored sizes.
 */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key.startsWith("uploads/") || key.includes("..")) return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const width = snapWidth(Number(url.searchParams.get("w")));
  const accept = req.headers.get("accept") ?? "";
  const fmt = accept.includes("image/avif") ? "avif" : accept.includes("image/webp") ? "webp" : "";
  const env = getEnv();

  const stored = width ? storedVariantFor(key, width) : key;
  const etag = `"${stored}${width ? `.${width}` : ""}${width && env.IMAGES ? `.${fmt}` : ""}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": IMMUTABLE, Vary: "Accept" } });

  let obj = await env.FILES.get(stored);
  // a missing compressed variant (older upload) falls back to the full-size file
  if (!obj && stored !== key) obj = await env.FILES.get(key);
  if (!obj && /-(thumb|md)\.webp$/.test(key)) obj = await env.FILES.get(key.replace(/-(thumb|md)\.webp$/, ".webp"));
  if (!obj) return new Response("Not found", { status: 404 });

  const type = obj.httpMetadata?.contentType ?? "application/octet-stream";
  const h = new Headers({ "Content-Type": type, "Cache-Control": IMMUTABLE, ETag: etag, "X-Content-Type-Options": "nosniff", Vary: "Accept" });

  // on-the-fly resize + AVIF/WebP (only for raster files, only when asked for a width, only when the binding exists)
  if (width && env.IMAGES && /^image\/(webp|jpeg|png)$/.test(type) && fmt) {
    const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
    const cacheKey = new Request(`${url.origin}/files/${key}?w=${width}&f=${fmt}`);
    try {
      const hit = await cache?.match(cacheKey);
      if (hit) return hit;
      const out = await env.IMAGES.input(obj.body).transform({ width, fit: "scale-down" }).output({ format: fmt === "avif" ? "image/avif" : "image/webp", quality: fmt === "avif" ? 62 : 78 });
      const res = new Response(out.image(), { headers: h });
      res.headers.set("Content-Type", out.contentType());
      if (cache) void cache.put(cacheKey, res.clone());
      return res;
    } catch (e) {
      console.error("image transform failed, serving stored file", e);
      obj = await env.FILES.get(stored); // the body was consumed
      if (!obj) return new Response("Not found", { status: 404 });
    }
  }
  return new Response(obj.body, { headers: h });
}
