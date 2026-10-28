/** One-off: re-write the sample category/product SVGs with XML-escaped labels (older seeds had a raw "&"). */
import { getPlatformProxy } from "wrangler";
import { svg } from "../src/features/admin/seed";

const C: [string, string, number][] = [
  ["watches", "Timepieces", 0],
  ["straps", "Straps & Bracelets", 1],
  ["wallets", "Leather Goods", 2],
  ["sunglasses", "Sunglasses", 3],
  ["cufflinks", "Cufflinks", 4],
];
async function main() {
const { env, dispose } = await getPlatformProxy<{ FILES: R2Bucket }>({ configPath: "wrangler.jsonc" });
for (const [slug, label, shape] of C) {
  await env.FILES.put(`uploads/sample-cat-${slug}.svg`, svg("", "", label, shape), { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}
await dispose();
console.log("repaired");
}
main().catch((e) => { console.error(e); process.exit(1); });
