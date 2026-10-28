// Worker-side enforcement: decides from the request alone (cookie + IP/UA) whether to bounce a visitor to Google. No per-request DB query.
import { loadBlocks, recordHit, isStaffSession } from "./block-index";
import { extractSignals, googleRedirect, matchSignals, readCookie, vidCookie } from "./signals";

/** Paths that are never document views for shoppers. */
export const EDGE_SKIP = /^\/(_next|api|files|admin|setup|pwa|sw\.js|manifest\.webmanifest|sitemap|robots\.txt|offline|accept-invite|favicon)|\.[a-z0-9]{2,5}$/i;

type Env = { DB?: D1Database; SECRETS_KEY?: string };

/** A redirect Response for a blocked visitor, or null to serve the page normally. */
export async function edgeBlock(request: Request, path: string, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response | null> {
  if ((request.method !== "GET" && request.method !== "HEAD") || !env.DB || EDGE_SKIP.test(path) || request.headers.has("x-cron")) return null;
  try {
    const { index, salt } = await loadBlocks(env.DB, env.SECRETS_KEY);
    if (!index.size) return null;
    const sig = await extractSignals(request.headers, salt);
    if (sig.bot) return null;
    const hit = matchSignals(index, sig);
    if (!hit) return null;
    if (await isStaffSession(env.DB, readCookie(request.headers.get("cookie"), "he_session"))) return null;
    ctx.waitUntil(recordHit(env.DB, hit));
    return googleRedirect(hit.visitorId ? vidCookie(hit.visitorId, new URL(request.url).protocol === "https:") : undefined);
  } catch (e) {
    console.error("edgeBlock", e); // never take the store down because of the block list
    return null;
  }
}
