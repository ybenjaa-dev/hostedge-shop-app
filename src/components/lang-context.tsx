"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { LangMeta } from "@/lib/i18n-core";

const BASE: LangMeta[] = [
  { code: "fr", name: "French", native: "Français", dir: "ltr", flag: "FR" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "rtl", flag: "MA" },
  { code: "en", name: "English", native: "English", dir: "ltr", flag: "GB" },
];
export type LangUiView = { style: "flag-code" | "flag" | "name" | "code" };
const Ctx = createContext<{ metas: LangMeta[]; ui: LangUiView }>({ metas: BASE, ui: { style: "flag-code" } });

/** Which languages exist (built-in + added by the owner) and how the switcher should look. Provided once by the root layout. */
export function LangMetaProvider({ metas, ui, children }: { metas: LangMeta[]; ui: LangUiView; children: ReactNode }) {
  return <Ctx.Provider value={{ metas, ui }}>{children}</Ctx.Provider>;
}
export const useLangMetas = () => useContext(Ctx).metas;
export const useLangUi = () => useContext(Ctx).ui;
export const useMeta = (code: string): LangMeta => useContext(Ctx).metas.find((m) => m.code === code) ?? { code, name: code, native: code.toUpperCase(), dir: "ltr", flag: "" };
export const useDirOf = (code: string): "ltr" | "rtl" => useContext(Ctx).metas.find((m) => m.code === code)?.dir ?? "ltr";
