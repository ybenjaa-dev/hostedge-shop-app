import { getEnv } from "@/lib/env";
import { MIGRATIONS } from "./migrations.generated";

let ready: Promise<void> | null = null;

/** Idempotent: applies any bundled migration not yet recorded in `_migrations`. */
export function ensureSchema(): Promise<void> {
  ready ??= run().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

function idempotent(sql: string) {
  return sql
    .replace(/^CREATE TABLE (?!IF NOT EXISTS)/i, "CREATE TABLE IF NOT EXISTS ")
    .replace(/^CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)/i, (_m, u) => `CREATE ${u ?? ""}INDEX IF NOT EXISTS `);
}

async function run() {
  const { DB } = getEnv();
  // one round trip: make sure the table exists and read it (this runs on every cold start, so it must be cheap)
  const [, rows] = await DB.batch([
    DB.prepare("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)"),
    DB.prepare("SELECT name FROM _migrations"),
  ]);
  const done = new Set(((rows?.results ?? []) as { name: string }[]).map((r) => r.name));
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    try {
      await DB.batch([
        ...m.statements.map((s) => DB.prepare(idempotent(s))),
        DB.prepare("INSERT OR IGNORE INTO _migrations (name, applied_at) VALUES (?, ?)").bind(m.name, Date.now()),
      ]);
    } catch (e) {
      // A migration applied out-of-band (e.g. `wrangler d1 migrations apply`) may fail on ALTERs; tolerate that.
      if (!/duplicate column|already exists/i.test(String(e))) throw e;
      await DB.prepare("INSERT OR IGNORE INTO _migrations (name, applied_at) VALUES (?, ?)").bind(m.name, Date.now()).run();
    }
  }
}
