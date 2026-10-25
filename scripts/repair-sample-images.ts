/** One-off: re-write the sample category/product SVGs with XML-escaped labels (older seeds had a raw "&"). */
import { getPlatformProxy } from "wrangler";
import { svg } from "../src/features/admin/seed";

const C: [string, string, string, string, number][] = [
  ["home", "#0f766e", "#14b8a6", "Home & Kitchen", 0],
  ["beauty", "#be185d", "#f472b6", "Beauty & Care", 1],
  ["gadgets", "#1d4ed8", "#60a5fa", "Gadgets", 2],
];
async function main() {
const { env, dispose } = await getPlatformProxy<{ FILES: R2Bucket }>({ configPath: "wrangler.jsonc" });
for (const [slug, a, b, label, shape] of C) {
  await env.FILES.put(`uploads/sample-cat-${slug}.svg`, svg(a, b, label, shape), { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}
await dispose();
console.log("repaired");
}
main().catch((e) => { console.error(e); process.exit(1); });
