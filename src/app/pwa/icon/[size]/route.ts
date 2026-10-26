import { getEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";

/** App icon. A raster logo/favicon is resized to a square PNG (when the Images binding exists); an SVG one is served as is; with none we draw the store's initial. */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = (await params).size === "192" ? 192 : 512;
  const s = await getSettings();
  const key = s.branding.favicon || s.branding.logo;
  const env = getEnv();
  if (key && !key.startsWith("/") && !/\.svg$/i.test(key)) {
    const obj = await env.FILES.get(key);
    if (obj) {
      if (env.IMAGES) {
        try {
          const out = await env.IMAGES.input(obj.body).transform({ width: size, height: size, fit: "contain", background: "#ffffff" }).output({ format: "image/png" });
          return new Response(out.image(), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
        } catch { /* fall through to the stored file */ }
      }
      const again = await env.FILES.get(key);
      if (again) return new Response(again.body, { headers: { "Content-Type": again.httpMetadata?.contentType ?? "image/webp", "Cache-Control": "public, max-age=86400" } });
    }
  }
  if (key && key.startsWith("/")) return Response.redirect(new URL(key, _req.url), 302);
  if (key && /\.svg$/i.test(key)) { const o = await env.FILES.get(key); if (o) return new Response(o.body, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" } }); }
  const initial = (s.store.name.trim()[0] ?? "S").toUpperCase().replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${s.branding.primary}"/><text x="256" y="340" font-family="system-ui,Arial,sans-serif" font-size="280" font-weight="800" text-anchor="middle" fill="#fff">${initial}</text></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=3600" } });
}
