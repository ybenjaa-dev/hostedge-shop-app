import { Sun, Droplets, Sprout, PawPrint } from "lucide-react";
import type { Care } from "../care";
import type { TFn } from "@/lib/dict";

const Pips = ({ n }: { n: number }) => <span className="pips" aria-hidden>{[1, 2, 3].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span>;

/** Compact light / water / difficulty chips for catalogue cards. */
export function CareChips({ care, t }: { care?: Care; t: TFn }) {
  if (!care?.light) return null;
  const light = t(`care.l${care.light}` as "care.l1");
  const water = t(`care.w${care.water ?? 1}` as "care.w1");
  const diff = t(`care.d${care.diff ?? 1}` as "care.d1");
  return (
    <ul className="flex flex-wrap gap-1" aria-label={t("care.title")}>
      <li className="care-chip sun" title={`${t("care.light")}: ${light}`}><Sun className="size-3.5" aria-hidden /><Pips n={care.light} /><span className="sr-only">{t("care.light")}: {light}</span></li>
      <li className="care-chip water" title={`${t("care.water")}: ${water}`}><Droplets className="size-3.5" aria-hidden /><Pips n={care.water ?? 1} /><span className="sr-only">{t("care.water")}: {water}</span></li>
      <li className="care-chip lvl" title={`${t("care.level")}: ${diff}`}><Sprout className="size-3.5" aria-hidden /><Pips n={care.diff ?? 1} /><span className="sr-only">{t("care.level")}: {diff}</span></li>
      {care.pet && <li className="care-chip pet" title={t("care.petBadge")}><PawPrint className="size-3.5" aria-hidden /><span className="sr-only">{t("care.petBadge")}</span></li>}
    </ul>
  );
}
