import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/settings";
import { isLang, type Lang } from "@/lib/i18n-core";
import { makeT } from "@/lib/dict";

export const getLang = cache(async (): Promise<Lang> => {
  const s = await getSettings();
  const c = (await cookies()).get("lang")?.value;
  if (isLang(c) && s.store.langs.includes(c)) return c;
  return s.store.defaultLang;
});

export async function getT() {
  const lang = await getLang();
  return { lang, t: makeT(lang) };
}
