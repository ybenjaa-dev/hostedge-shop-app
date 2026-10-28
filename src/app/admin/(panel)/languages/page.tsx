import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { allLangMetas, LANGS } from "@/lib/i18n-core";
import { getLangConfig, pristineKeys } from "@/lib/languages";
import { PageHeader, Panel, Badge } from "@/features/admin/components/ui";
import { DataTable, Td } from "@/features/settings/components/table";
import { ActionButton } from "@/features/settings/components/action-button";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, Toggle } from "@/features/admin/components/fields";
import { Flag } from "@/components/flags";
import { AddLanguageForm } from "@/features/languages/components/add-form";
import { makeDefaultLanguage, removeLanguage, saveLanguageDisplay, toggleLanguage } from "@/features/languages/actions";

export const metadata = { title: "Languages" };

export default async function LanguagesPage() {
  await requireOwner();
  const [s, cfg] = [await getSettings(), await getLangConfig()];
  const total = pristineKeys().length;
  const metas = allLangMetas();
  const ui = cfg.ui;
  return (
    <div>
      <PageHeader title="Languages" sub="Which languages your shop speaks, who sees the switchers, and every text you can translate." />
      <div className="space-y-6">
        <Panel title="Your languages">
          <DataTable minWidth="46rem" head={["Language", "Code", "Texts", "In the shop", "Default", ""]}>
            {metas.map((m) => {
              const on = s.store.langs.includes(m.code), isDef = s.store.defaultLang === m.code;
              const done = Object.keys(cfg.strings[m.code] ?? {}).length;
              const builtin = (LANGS as readonly string[]).includes(m.code);
              return (
                <tr key={m.code}>
                  <Td><span className="flex items-center gap-2.5"><Flag lang={m.code} /><span><b>{m.native}</b><span className="block text-xs text-muted">{m.name} · {m.dir === "rtl" ? "right to left" : "left to right"}</span></span></span></Td>
                  <Td className="font-mono text-xs uppercase">{m.code}</Td>
                  <Td className="text-sm">{builtin ? <span className="text-muted">{done ? `${done} customised` : "Complete"}</span> : <span className={done >= total ? "font-semibold text-ok" : ""}>{Math.min(100, Math.round((done / total) * 100))}% · {done}/{total}</span>}</Td>
                  <Td><ActionButton action={toggleLanguage} fields={{ code: m.code, on: on ? "0" : "1" }} className={`btn btn-sm ${on ? "btn-primary" : "btn-outline"}`}>{on ? "On" : "Off"}</ActionButton></Td>
                  <Td>{isDef ? <Badge color="#0d9488">Default</Badge> : on ? <ActionButton action={makeDefaultLanguage} fields={{ code: m.code }} confirm={`Make ${m.native} the default language?`}>Make default</ActionButton> : <span className="text-muted">—</span>}</Td>
                  <Td><div className="flex justify-end gap-2"><Link href={`/admin/languages/${m.code}`} className="btn btn-outline btn-sm">{builtin ? "Edit wording" : "Translate"}</Link>
                    {!builtin && <ActionButton action={removeLanguage} fields={{ code: m.code }} confirm={`Remove ${m.native}? Its translated texts are deleted.`} className="btn btn-outline btn-sm !text-danger">Remove</ActionButton>}</div></Td>
                </tr>
              );
            })}
          </DataTable>
          <p className="mt-3 text-xs text-muted">Product names, descriptions, categories and pages get a new tab for every language you switch on. Texts without a translation fall back to the language you chose when adding it.</p>
        </Panel>

        <Panel title="Add a language"><AddLanguageForm existing={metas.map((m) => m.code)} /></Panel>

        <Panel title="Switchers in the shop header">
          <AdminForm action={saveLanguageDisplay} submitLabel="Save display options" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-line p-4">
                <h3 className="display font-extrabold">Language switcher</h3>
                <Toggle name="langShow" label="Show the language switcher" hint="Off hides it everywhere. Visitors keep the language you set as default." defaultChecked={ui.langSwitcher.show} />
                <Toggle name="langMobile" label="Show it on phones" hint="Turn off to keep the mobile header clean." defaultChecked={ui.langSwitcher.mobile} />
                <Field label="Looks like" htmlFor="lstyle"><select id="lstyle" name="style" defaultValue={ui.langSwitcher.style} className="field">
                  <option value="flag-code">Flag + code (🇫🇷 FR)</option><option value="flag">Flag only</option><option value="code">Code only (FR)</option><option value="name">Language name (Français)</option></select></Field>
                <Toggle name="autoDetect" label="Detect the visitor's language" hint="First visit only: use the browser language if you offer it, otherwise the default." defaultChecked={ui.autoDetect} />
              </div>
              <div className="space-y-3 rounded-2xl border border-line p-4">
                <h3 className="display font-extrabold">Light / dark switcher</h3>
                <Toggle name="themeShow" label="Show the light/dark button" hint="Off hides it and ignores any earlier choice — everyone sees the default below." defaultChecked={ui.themeToggle.show} />
                <Toggle name="themeMobile" label="Show it on phones" defaultChecked={ui.themeToggle.mobile} />
                <Field label="Default appearance" htmlFor="tdef"><select id="tdef" name="themeDefault" defaultValue={ui.themeToggle.default} className="field">
                  <option value="system">Follow the visitor&apos;s device</option><option value="light">Always start light</option><option value="dark">Always start dark</option></select></Field>
              </div>
            </div>
          </AdminForm>
        </Panel>
      </div>
    </div>
  );
}
