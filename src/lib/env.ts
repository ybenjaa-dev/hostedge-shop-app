import { getCloudflareContext } from "@opennextjs/cloudflare";

export type AppEnv = {
  DB: D1Database;
  FILES: R2Bucket;
  SECRETS_KEY?: string;
  /** Cloudflare Images binding — optional; enables on-the-fly resize and AVIF/WebP for `/files/…?w=`. */
  IMAGES?: ImagesBinding;
};

export function getEnv(): AppEnv {
  return getCloudflareContext().env as unknown as AppEnv;
}

/** Run background work after the response when possible (Workers waitUntil). */
export function waitUntil(p: Promise<unknown>) {
  try {
    getCloudflareContext().ctx.waitUntil(p);
  } catch {
    void p.catch(() => {});
  }
}
