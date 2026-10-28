import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getSettings } from "@/lib/settings";
import { isLang, type Lang } from "@/lib/i18n-core";
import { ensureLangs } from "@/lib/languages";
import { makeT } from "@/lib/dict";

export const getLang = cache(async (): Promise<Lang> => {
  const [s, { ui }] = await Promise.all([getSettings(), ensureLangs()]);
  const c = (await cookies()).get("lang")?.value;
  if (isLang(c) && s.store.langs.includes(c)) return c;
  // first visit: follow the browser's language when the owner turned that on
  if (ui.autoDetect) {
    const al = (await headers()).get("accept-language") ?? "";
    for (const part of al.split(",")) { const code = part.trim().split(/[;-]/)[0]!.toLowerCase(); if (code && s.store.langs.includes(code)) return code; }
  }
  return s.store.defaultLang;
});

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
