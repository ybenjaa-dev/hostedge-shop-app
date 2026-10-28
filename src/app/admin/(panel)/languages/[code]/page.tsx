import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/auth";
import { allLangs, langMeta, LANGS } from "@/lib/i18n-core";
import { getLangConfig, pristineKeys, pristineText } from "@/lib/languages";
import { PageHeader, Panel, Pager, FilterBar, FbItem, Empty } from "@/features/admin/components/ui";
import { ActionButton } from "@/features/settings/components/action-button";
import { one, pageNum } from "@/features/settings/lib";
import { TranslateForm } from "@/features/languages/components/translate-form";
import { ImportForm } from "@/features/languages/components/import-form";
import { resetTranslations } from "@/features/languages/actions";

export const metadata = { title: "Translate" };
const PER = 30;

export default async function TranslatePage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireOwner();
  const { code } = await params;
  const cfg = await getLangConfig();
  const meta = allLangs().includes(code) ? langMeta(code) : undefined;
  if (!meta) notFound();
  const sp = await searchParams;
  const q = one(sp.q).trim().toLowerCase().slice(0, 60), only = one(sp.only), page = pageNum(sp.page);
  const builtin = (LANGS as readonly string[]).includes(code);
  const base = builtin ? code : cfg.fallback[code] ?? "en";
  const mine = cfg.strings[code] ?? {};
  const keys = pristineKeys();
  const sourceOf = (k: string) => pristineText("en", k) || pristineText(base, k);
  const filtered = keys.filter((k) => {
    if (only === "missing" && k in mine) return false;
    if (only === "done" && !(k in mine)) return false;
    if (q && !(k.toLowerCase().includes(q) || sourceOf(k).toLowerCase().includes(q) || (mine[k] ?? "").toLowerCase().includes(q))) return false;
    return true;
  });
  const slice = filtered.slice((page - 1) * PER, page * PER);
  const done = Object.keys(mine).length;
  return (
    <div>
      <PageHeader title={`${builtin ? "Edit wording" : "Translate"} · ${meta.native}`} sub={builtin ? "Change any text of the built-in interface for this language. Leave a field empty to keep the original." : `${done} of ${keys.length} texts translated. Empty fields show the ${base.toUpperCase()} text.`}
        actions={<Link href="/admin/languages" className="btn btn-outline btn-sm">← Languages</Link>} />
      <FilterBar actions={<><button className="btn btn-primary">Filter</button>{(q || only) && <Link href={`/admin/languages/${code}`} className="btn btn-outline">Clear</Link>}</>}>
        <FbItem grow><input name="q" defaultValue={q} placeholder="Search a text or key…" aria-label="Search texts" className="field" /></FbItem>
        <FbItem><select name="only" defaultValue={only} className="field" aria-label="Show"><option value="">All texts</option><option value="missing">Not translated yet</option><option value="done">{builtin ? "Customised" : "Translated"}</option></select></FbItem>
      </FilterBar>
      {slice.length === 0 ? <Empty title="No texts match" /> : <TranslateForm code={code} dir={meta.dir} rows={slice.map((k) => ({ key: k, source: sourceOf(k), value: mine[k] ?? pristineText(base, k), edited: k in mine }))} />}
      <Pager page={page} pages={Math.max(1, Math.ceil(filtered.length / PER))} base={`/admin/languages/${code}`} params={{ q, only }} />
      <Panel title="Work in a spreadsheet" className="mt-6">
        <p className="mb-3 text-sm text-muted">Download every text, give the file to a translator, then import it back. Keep the columns: key, English text, translation.</p>
        <div className="flex flex-wrap items-end gap-3">
          <a className="btn btn-outline btn-sm" href={`/admin/languages/${code}/export`}>Download CSV</a>
          <ImportForm code={code} />
          {done > 0 && <ActionButton action={resetTranslations} fields={{ code }} confirm="Delete every translation for this language?" className="btn btn-outline btn-sm !text-danger">{builtin ? "Restore original wording" : "Clear translations"}</ActionButton>}
        </div>
      </Panel>
    </div>
  );
}
