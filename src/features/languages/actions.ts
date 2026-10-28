"use server";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { getSettings, saveSettings } from "@/lib/settings";
import { LANGS, allLangs, type LangMeta } from "@/lib/i18n-core";
import { LANG_PRESETS } from "@/lib/lang-presets";
import { DEFAULT_UI, getLangConfig, pristineKeys, pristineText, saveLangConfig, saveLangUi, saveStrings, type LangUi } from "@/lib/languages";
import { parseCsv } from "@/lib/csv";
import { fail, refresh } from "@/features/settings/lib";

const builtin = (c: string) => (LANGS as readonly string[]).includes(c);

async function setStoreLangs(mut: (langs: string[], def: string) => { langs: string[]; def: string }) {
  const s = await getSettings();
  const r = mut([...s.store.langs], s.store.defaultLang);
  await saveSettings("store", { ...s.store, langs: allLangs().filter((l) => r.langs.includes(l) || l === r.def), defaultLang: r.def });
}

export async function addLanguage(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const preset = LANG_PRESETS.find((p) => p.code === fd(form, "preset"));
    const meta: LangMeta = preset
      ? { ...preset, custom: true }
      : { code: fd(form, "code").toLowerCase(), name: fd(form, "name").slice(0, 40), native: fd(form, "native").slice(0, 40), dir: fd(form, "dir") === "rtl" ? "rtl" : "ltr", flag: fd(form, "flag").toUpperCase().slice(0, 2), custom: true };
    if (!/^[a-z]{2}$/.test(meta.code)) return fail("Use a two-letter language code such as es, de or tr.");
    if (!meta.native || !meta.name) return fail("Give the language a name.");
    if (allLangs().includes(meta.code)) return fail("This language already exists.");
    const copy = fd(form, "copyFrom");
    const cfg = await getLangConfig();
    await saveLangConfig({ custom: [...cfg.custom, meta], fallback: { ...cfg.fallback, [meta.code]: builtin(copy) ? copy : "en" } });
    await setStoreLangs((langs, def) => ({ langs: [...langs, meta.code], def }));
    await audit(user, "language.add", "language", meta.code);
    refresh();
    return { message: `${meta.native} added — texts show in ${builtin(copy) ? copy.toUpperCase() : "EN"} until you translate them.`, id: meta.code };
  });
}

export async function removeLanguage(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const code = fd(form, "code");
    const cfg = await getLangConfig();
    if (!cfg.custom.some((c) => c.code === code)) return fail("Built-in languages can't be removed — switch them off instead.");
    const { [code]: _s, ...strings } = cfg.strings; void _s;
    const { [code]: _f, ...fallback } = cfg.fallback; void _f;
    await setStoreLangs((langs, def) => ({ langs: langs.filter((l) => l !== code), def: def === code ? "en" : def }));
    await saveLangConfig({ custom: cfg.custom.filter((c) => c.code !== code), fallback });
    await saveStrings(strings);
    await audit(user, "language.remove", "language", code);
    refresh();
    return { message: "Language removed. Content you wrote in it is kept, in case you add it back." };
  });
}

export async function toggleLanguage(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const code = fd(form, "code"), on = fd(form, "on") === "1";
    if (!allLangs().includes(code)) return fail("Unknown language");
    const s = await getSettings();
    if (!on && s.store.defaultLang === code) return fail("This is the default language — choose another default first.");
    if (!on && s.store.langs.filter((l) => l !== code).length < 1) return fail("Keep at least one language on.");
    await setStoreLangs((langs, def) => ({ langs: on ? [...langs, code] : langs.filter((l) => l !== code), def }));
    await audit(user, on ? "language.enable" : "language.disable", "language", code);
    refresh();
    return { message: on ? "Language is now available in the shop" : "Language hidden from the shop" };
  });
}

export async function makeDefaultLanguage(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const code = fd(form, "code");
    if (!allLangs().includes(code)) return fail("Unknown language");
    await setStoreLangs((langs) => ({ langs: [...langs, code], def: code }));
    await audit(user, "language.default", "language", code);
    refresh();
    return { message: "Default language changed" };
  });
}

/** One page of the translation table. Empty fields (or text identical to the source) clear the override. */
export async function saveTranslations(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const code = fd(form, "code");
    if (!allLangs().includes(code)) return fail("Unknown language");
    const known = new Set(pristineKeys());
    const cfg = await getLangConfig();
    const mine = { ...(cfg.strings[code] ?? {}) };
    const base = builtin(code) ? code : cfg.fallback[code] ?? "en";
    let changed = 0;
    for (const key of form.getAll("keys").map(String)) {
      if (!known.has(key)) continue;
      const v = String(form.get(`t:${key}`) ?? "").trim().slice(0, 1000);
      if (v && v !== pristineText(base, key)) { if (mine[key] !== v) changed++; mine[key] = v; }
      else if (key in mine) { delete mine[key]; changed++; }
    }
    await saveStrings({ ...cfg.strings, [code]: mine });
    await audit(user, "language.translate", "language", code, { changed });
    refresh();
    return { message: changed ? `${changed} text${changed === 1 ? "" : "s"} saved` : "Nothing changed" };
  });
}

export async function resetTranslations(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const code = fd(form, "code");
    const cfg = await getLangConfig();
    const { [code]: _x, ...rest } = cfg.strings; void _x;
    await saveStrings(rest);
    await audit(user, "language.reset", "language", code);
    refresh();
    return { message: "Translations cleared" };
  });
}

/** CSV with columns key,text (the format the export produces). */
export async function importTranslations(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const code = fd(form, "code");
    const file = form.get("file");
    if (!allLangs().includes(code)) return fail("Unknown language");
    if (!(file instanceof File) || !file.size) return fail("Choose a CSV file.");
    if (file.size > 600_000) return fail("File too large.");
    const rows = parseCsv((await file.text()).replace(/^﻿/, ""));
    const known = new Set(pristineKeys());
    const cfg = await getLangConfig();
    const mine = { ...(cfg.strings[code] ?? {}) };
    const base = builtin(code) ? code : cfg.fallback[code] ?? "en";
    let n = 0;
    for (const r of rows) {
      const key = r[0]?.trim(); const text = (r[r.length - 1] ?? "").trim();
      if (!key || !known.has(key) || r.length < 2 || !text || text === pristineText(base, key)) continue;
      mine[key] = text.slice(0, 1000); n++;
    }
    if (!n) return fail("No usable rows found. Use the exported file: key, English text, translation.");
    await saveStrings({ ...cfg.strings, [code]: mine });
    await audit(user, "language.import", "language", code, { n });
    refresh();
    return { message: `${n} texts imported` };
  });
}

export async function saveLanguageDisplay(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const style = fd(form, "style");
    const theme = fd(form, "themeDefault");
    const ui: LangUi = {
      langSwitcher: { show: form.get("langShow") === "1", mobile: form.get("langMobile") === "1", style: (["flag-code", "flag", "name", "code"] as const).find((x) => x === style) ?? DEFAULT_UI.langSwitcher.style },
      themeToggle: { show: form.get("themeShow") === "1", mobile: form.get("themeMobile") === "1", default: (["system", "light", "dark"] as const).find((x) => x === theme) ?? "system" },
      autoDetect: form.get("autoDetect") === "1",
    };
    await saveLangUi(ui);
    await audit(user, "settings.langui", "settings", "ui_header");
    refresh();
    return { message: "Display options saved" };
  });
}
