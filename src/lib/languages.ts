import "server-only";
import { getRaw, setRaw } from "@/lib/settings";
import { DICT } from "@/lib/dict";
import { LANGS, setCustomLangs, customLangs, type LangMeta } from "@/lib/i18n-core";

export type LangUi = {
  langSwitcher: { show: boolean; mobile: boolean; style: "flag-code" | "flag" | "name" | "code" };
  themeToggle: { show: boolean; mobile: boolean; default: "system" | "light" | "dark" };
  autoDetect: boolean;
};
export const DEFAULT_UI: LangUi = {
  langSwitcher: { show: true, mobile: true, style: "flag-code" },
  themeToggle: { show: true, mobile: true, default: "system" },
  autoDetect: false,
};
type Stored = { custom: LangMeta[]; fallback: Record<string, string> };
export type Strings = Record<string, Record<string, string>>;

const K_CFG = "languages", K_STR = "ui_strings", K_UI = "ui_header";
const PRISTINE = new Map<string, Record<string, string>>();
let cache: { at: number; cfg: Stored; strings: Strings; ui: LangUi } | null = null;

const parse = <T,>(raw: string | null, d: T): T => { try { return raw ? { ...d, ...(JSON.parse(raw) as object) } as T : d; } catch { return d; } };

/** Load the saved languages once every few seconds and push them into the dictionaries (so every `t()` in the app sees them). */
export async function ensureLangs(force = false) {
  if (!force && cache && Date.now() - cache.at < 10_000) return cache;
  const [c, s, u] = await Promise.all([getRaw(K_CFG), getRaw(K_STR), getRaw(K_UI)]);
  const cfg = parse<Stored>(c, { custom: [], fallback: {} });
  const strings = parse<Strings>(s, {});
  const ui = { ...DEFAULT_UI, ...parse<Partial<LangUi>>(u, {}), } as LangUi;
  ui.langSwitcher = { ...DEFAULT_UI.langSwitcher, ...ui.langSwitcher }; ui.themeToggle = { ...DEFAULT_UI.themeToggle, ...ui.themeToggle };
  const dict = DICT as unknown as Record<string, Record<string, string>>;
  for (const c of LANGS) if (!PRISTINE.has(c)) PRISTINE.set(c, { ...dict[c]! });
  setCustomLangs(cfg.custom.map((m) => ({ ...m, custom: true })));
  const live = new Set<string>(LANGS);
  for (const m of customLangs()) live.add(m.code);
  for (const code of Object.keys(dict)) if (!live.has(code)) delete dict[code];
  for (const code of LANGS) dict[code] = strings[code] && Object.keys(strings[code]).length ? { ...PRISTINE.get(code)!, ...strings[code] } : PRISTINE.get(code)!;
  for (const m of customLangs()) {
    const base = cfg.fallback[m.code] && PRISTINE.has(cfg.fallback[m.code]!) ? cfg.fallback[m.code]! : "en";
    dict[m.code] = { ...PRISTINE.get(base)!, ...(strings[m.code] ?? {}) };
  }
  cache = { at: Date.now(), cfg, strings, ui };
  return cache;
}

export async function getLangUi(): Promise<LangUi> { return (await ensureLangs()).ui; }
export async function getLangConfig() { const c = await ensureLangs(); return { custom: c.cfg.custom, fallback: c.cfg.fallback, strings: c.strings, ui: c.ui }; }
export const pristineKeys = (): string[] => Object.keys(PRISTINE.get("en") ?? (DICT as unknown as Record<string, object>).en);
export const pristineText = (code: string, key: string): string => PRISTINE.get(code)?.[key] ?? "";

export async function saveLangConfig(cfg: Stored) { await setRaw(K_CFG, JSON.stringify(cfg)); await ensureLangs(true); }
export async function saveStrings(strings: Strings) { await setRaw(K_STR, JSON.stringify(strings)); await ensureLangs(true); }
export async function saveLangUi(ui: LangUi) { await setRaw(K_UI, JSON.stringify(ui)); await ensureLangs(true); }
