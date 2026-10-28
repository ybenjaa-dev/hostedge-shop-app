/** One-off: re-write the sample category SVGs in local R2. */
import { getPlatformProxy } from "wrangler";
import { categoryArt } from "../src/features/admin/furniture-art";

const SLUGS = ["sofas", "chairs", "tables", "storage", "lighting"];
async function main() {
const { env, dispose } = await getPlatformProxy<{ FILES: R2Bucket }>({ configPath: "wrangler.jsonc" });
for (const slug of SLUGS) {
  await env.FILES.put(`uploads/sample-cat-${slug}.svg`, categoryArt(slug), { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}
await dispose();
console.log("repaired");
}
main().catch((e) => { console.error(e); process.exit(1); });
