/** One-off: re-write the sample category SVGs. */
import { getPlatformProxy } from "wrangler";
import { plantArt, CAT_ART } from "../src/features/admin/plant-art";

const C = Object.keys(CAT_ART);
async function main() {
const { env, dispose } = await getPlatformProxy<{ FILES: R2Bucket }>({ configPath: "wrangler.jsonc" });
for (const slug of C) {
  await env.FILES.put(`uploads/sample-cat-${slug}.svg`, plantArt(CAT_ART[slug]!), { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}
await dispose();
console.log("repaired");
}
main().catch((e) => { console.error(e); process.exit(1); });
