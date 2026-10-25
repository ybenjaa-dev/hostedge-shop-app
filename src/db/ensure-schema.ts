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
  await DB.exec("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)");
  const done = new Set(
    ((await DB.prepare("SELECT name FROM _migrations").all<{ name: string }>()).results ?? []).map((r) => r.name),
  );
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
