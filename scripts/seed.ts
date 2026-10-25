/**
 * Seed sample data into the LOCAL D1/R2 emulation (same data the setup wizard's "sample data" option loads).
 *   npm run seed                       # country MA, currency MAD
 *   npm run seed -- --country SA --currency SAR
 * It never creates an admin account — the first visit to the site runs the setup wizard.
 */
import { getPlatformProxy } from "wrangler";
import { MIGRATIONS } from "../src/db/migrations.generated";
import { seedCities, seedPages, seedSampleData } from "../src/features/admin/seed";
import { CURRENCIES } from "../src/lib/money";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? (process.argv[i + 1] ?? d) : d;
};

async function main() {
  const country = arg("country", "MA").toUpperCase();
  const currency = arg("currency", "MAD").toUpperCase();
  if (!(currency in CURRENCIES)) throw new Error(`Unsupported currency ${currency}`);
  const { env, dispose } = await getPlatformProxy<{ DB: D1Database; FILES: R2Bucket }>({ configPath: "wrangler.jsonc" });
  try {
    await env.DB.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)");
    for (const m of MIGRATIONS) {
      const done = await env.DB.prepare("SELECT 1 FROM _migrations WHERE name = ?").bind(m.name).first();
      if (done) continue;
      await env.DB.batch([
        ...m.statements.map((s) => env.DB.prepare(s.replace(/^CREATE TABLE /i, "CREATE TABLE IF NOT EXISTS ").replace(/^CREATE (UNIQUE )?INDEX /i, (_x, u) => `CREATE ${u ?? ""}INDEX IF NOT EXISTS `))),
        env.DB.prepare("INSERT OR IGNORE INTO _migrations (name, applied_at) VALUES (?, ?)").bind(m.name, Date.now()),
      ]);
    }
    const fee = 30 * 10 ** CURRENCIES[currency]!.decimals;
    await seedCities(env, country, fee);
    await seedPages(env);
    await seedSampleData(env, currency);
    console.log(`Seeded sample data (${country}/${currency}). Open the site to run the setup wizard.`);
  } finally {
    await dispose();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
