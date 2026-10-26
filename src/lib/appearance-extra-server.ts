import "server-only";
import { cache } from "react";
import { getRaw, setRaw } from "@/lib/settings";
import { parseExtra, type Extra } from "@/lib/appearance-extra";

export const getExtra = cache(async (): Promise<Extra> => parseExtra(await getRaw("appearance_extra")));
export const saveExtra = (e: Extra) => setRaw("appearance_extra", JSON.stringify(e));
