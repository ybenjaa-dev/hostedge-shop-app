"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n-core";
import type { DictKey, TFn } from "@/lib/dict";
import type { CityOpt } from "@/features/catalog/queries";

export type ClientStore = {
  lang: Lang;
  currency: string;
  codMode: boolean;
  placement: "inline" | "inline-open" | "popup" | "page";
  codFee: number;
  defaultShippingFee: number;
  freeThreshold: number;
  taxRateBp: number;
  taxInclusive: boolean;
  country: string;
  countries: string[];
  whatsapp: string;
  bundlesInForm: boolean;
  dict: Record<DictKey, string>;
};

const Ctx = createContext<ClientStore | null>(null);

export function StoreProvider({ value, children }: { value: ClientStore; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore(): ClientStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("StoreProvider missing");
  return v;
}
export function useT(): TFn {
  const { dict, lang } = useStore();
  // build a TFn over the provided dictionary subset
  return (key, vars) => {
    let s = dict[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
export type { CityOpt };
