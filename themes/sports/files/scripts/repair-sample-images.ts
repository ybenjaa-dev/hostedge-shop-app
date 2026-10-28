/** One-off: re-write the sample category/product SVGs with XML-escaped labels (older seeds had a raw "&"). */
import { getPlatformProxy } from "wrangler";
import { svg } from "../src/features/admin/seed";

const C: [string, string, string, string, number][] = [
  ["running", "#c6ff00", "", "Running", 0],
  ["gym", "#ff5a1f", "", "Gym & Strength", 1],
  ["yoga", "#b46bff", "", "Yoga & Mobility", 2],
  ["cycling", "#18d2ff", "", "Cycling", 3],
  ["football", "#ffd400", "", "Football", 4],
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
