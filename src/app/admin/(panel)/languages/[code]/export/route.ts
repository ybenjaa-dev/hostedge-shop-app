import { getSessionUser } from "@/lib/auth";
import { allLangs, LANGS } from "@/lib/i18n-core";
import { getLangConfig, pristineKeys, pristineText } from "@/lib/languages";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const u = await getSessionUser();
  if (!u || u.role !== "owner") return new Response("Forbidden", { status: 403 });
  const { code } = await params;
  const cfg = await getLangConfig();
  if (!allLangs().includes(code)) return new Response("Not found", { status: 404 });
  const base = (LANGS as readonly string[]).includes(code) ? code : cfg.fallback[code] ?? "en";
  const mine = cfg.strings[code] ?? {};
  const rows: unknown[][] = [["key", "English", code], ...pristineKeys().map((k) => [k, pristineText("en", k), mine[k] ?? pristineText(base, k)])];
  return new Response(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="translations-${code}.csv"` } });
}
