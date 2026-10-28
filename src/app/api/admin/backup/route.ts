import { getSessionUser, logActivity } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { rateLimit } from "@/lib/ratelimit";
import { BACKUP_TABLES, CSV_TABLES } from "@/features/settings/backup-tables";

export const dynamic = "force-dynamic";
const PAGE = 500;
const enc = new TextEncoder();

async function* pages(table: string, omit: string[] = [], where?: string): AsyncGenerator<Record<string, unknown>[]> {
  const { DB } = getEnv();
  let last = 0;
  for (;;) {
    const sql = `SELECT rowid AS _rid, * FROM "${table}" WHERE rowid > ?1${where ? ` AND (${where})` : ""} ORDER BY rowid LIMIT ${PAGE}`;
    const rows = (await DB.prepare(sql).bind(last).all<Record<string, unknown>>()).results ?? [];
    if (!rows.length) return;
    last = Number(rows[rows.length - 1]!._rid);
    yield rows.map((r) => { const { _rid, ...rest } = r; void _rid; for (const c of omit) delete rest[c]; return rest; });
    if (rows.length < PAGE) return;
  }
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Neutralise spreadsheet formula injection for text values.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function stream(gen: AsyncGenerator<string>): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async pull(c) {
      const r = await gen.next();
      if (r.done) c.close(); else c.enqueue(enc.encode(r.value));
    },
    async cancel() { await gen.return(undefined); },
  });
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "owner") return Response.json({ error: "Owner permission required" }, { status: 403 });
  await ensureSchema();
  const rl = await rateLimit(`backup:${user.id}`, 10, 300);
  if (!rl.ok) return Response.json({ error: "Too many exports. Try again shortly." }, { status: 429 });
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

  if (format === "csv") {
    const table = url.searchParams.get("table") ?? "";
    if (!(CSV_TABLES as readonly string[]).includes(table)) return Response.json({ error: "Unknown table" }, { status: 400 });
    const omit = BACKUP_TABLES.find((t) => t.name === table)?.omitColumns ?? [];
    await logActivity(user, "backup.export", "csv", table);
    const gen = (async function* () {
      const cols = ((await getEnv().DB.prepare(`PRAGMA table_info("${table}")`).all<{ name: string }>()).results ?? []).map((c) => c.name).filter((c) => !omit.includes(c));
      yield "﻿" + cols.join(",") + "\r\n";
      for await (const rows of pages(table, omit)) yield rows.map((r) => cols.map((c) => csvCell(r[c])).join(",")).join("\r\n") + "\r\n";
    })();
    return new Response(stream(gen), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${table}-${stamp}.csv"` } });
  }
  if (format !== "json") return Response.json({ error: "Unknown format" }, { status: 400 });

  await logActivity(user, "backup.export", "json", "all");
  const gen = (async function* () {
    yield `{"exportedAt":${Date.now()},"version":1,"tables":{`;
    let firstTable = true;
    for (const t of BACKUP_TABLES) {
      yield `${firstTable ? "" : ","}${JSON.stringify(t.name)}:[`;
      firstTable = false;
      let first = true;
      for await (const rows of pages(t.name, t.omitColumns, t.where)) {
        for (const r of rows) { yield (first ? "" : ",") + JSON.stringify(r); first = false; }
      }
      yield "]";
    }
    yield "}}";
  })();
  return new Response(stream(gen), { headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="backup-${stamp}.json"` } });
}
