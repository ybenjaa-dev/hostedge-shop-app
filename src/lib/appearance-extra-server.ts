import "server-only";
import { cache } from "react";
import { setRaw } from "@/lib/settings";
import { parseExtra, type Extra } from "@/lib/appearance-extra";
import { ensureLangs, getExtraRaw } from "@/lib/languages";

/** Read together with the language settings (one query), so the storefront pays for it once. */
export const getExtra = cache(async (): Promise<Extra> => parseExtra(await getExtraRaw()));
export const saveExtra = async (e: Extra) => { await setRaw("appearance_extra", JSON.stringify(e)); await ensureLangs(true); };
