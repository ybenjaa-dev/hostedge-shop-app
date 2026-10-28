import { Sun, Droplets, PawPrint, Check, PackageOpen, Sprout } from "lucide-react";
import type { Care } from "../care";
import type { TFn } from "@/lib/dict";

const Pips = ({ n }: { n: number }) => <span className="pips" aria-hidden>{[1, 2, 3].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span>;

/** Three big icon tiles (light / water / difficulty) shown near the buy box. */
export function CareTiles({ care, t }: { care?: Care; t: TFn }) {
  if (!care?.light) return null;
  const tiles = [
    { cls: "sun", Icon: Sun, label: t("care.light"), value: t(`care.l${care.light}` as "care.l1"), n: care.light },
    { cls: "water", Icon: Droplets, label: t("care.water"), value: t(`care.w${care.water ?? 1}` as "care.w1"), n: care.water ?? 1 },
    { cls: "lvl", Icon: Sprout, label: t("care.level"), value: t(`care.d${care.diff ?? 1}` as "care.d1"), n: care.diff ?? 1 },
  ];
  return (
    <ul className="grid grid-cols-3 gap-2.5 sm:gap-3" aria-label={t("care.title")}>
      {tiles.map(({ cls, Icon, label, value, n }) => (
        <li key={label} className={`care-chip ${cls} !flex-col !items-start !gap-1 !rounded-3xl !p-3 !text-[0.78rem]`}>
          <span className="flex w-full items-center justify-between"><Icon className="size-6" aria-hidden /><Pips n={n} /></span>
          <span className="opacity-70">{label}</span>
          <span className="display text-[0.95rem] leading-tight">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/** CSS-only tabs (radio inputs): light · water · pet-safe. */
export function CareTabs({ care, t }: { care: Care; t: TFn }) {
  const tabs = [
    { id: "light", Icon: Sun, label: t("care.light"), head: t(`care.l${care.light ?? 2}` as "care.l1"), body: t(`care.lt${care.light ?? 2}` as "care.lt1"), cls: "bg-sun" },
    { id: "water", Icon: Droplets, label: t("care.water"), head: t(`care.w${care.water ?? 2}` as "care.w1"), body: t(`care.wt${care.water ?? 2}` as "care.wt1"), cls: "bg-sky" },
    { id: "pet", Icon: PawPrint, label: t("care.pet"), head: care.pet ? t("care.petBadge") : "!", body: care.pet ? t("care.petOk") : t("care.petNo"), cls: care.pet ? "bg-mint" : "bg-blush" },
  ];
  return (
    <div className="ct">
      {tabs.map((tab, i) => <input key={tab.id} type="radio" name="care-tab" id={`ct-${tab.id}`} defaultChecked={i === 0} aria-label={tab.label} />)}
      <div className="ct-labels" role="presentation">
        {tabs.map(({ id, Icon, label }) => <label key={id} htmlFor={`ct-${id}`} className="btn btn-outline !min-h-11"><Icon className="size-5" aria-hidden />{label}</label>)}
      </div>
      <div className="ct-panels mt-5">
        {tabs.map(({ id, Icon, head, body, cls }) => (
          <div key={id} className="flex items-center gap-5">
            <span className={`blob-2 grid size-20 shrink-0 place-items-center border-2 border-edge text-[#1f3d2b] shadow-[3px_3px_0_var(--edge)] sm:size-24 ${cls}`}><Icon className="size-9 sm:size-11" aria-hidden /></span>
            <div><p className="display text-2xl">{head}</p><p className="mt-1 max-w-xl text-muted">{body}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Checklist-style "what's in the box". */
export function BoxList({ kind, t }: { kind: Care["kind"]; t: TFn }) {
  const items = [1, 2, 3].map((n) => t(`box.${kind}${n}` as "box.plant1"));
  return (
    <div>
      <h2 className="display mb-4 flex items-center gap-2 text-2xl"><PackageOpen className="size-6" aria-hidden />{t("box.title")}</h2>
      <ul className="space-y-3">
        {items.map((x, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg border-2 border-edge bg-sun text-[#1f3d2b] shadow-[2px_2px_0_var(--edge)]"><Check className="size-4" strokeWidth={3.5} aria-hidden /></span>
            <span className="text-lg">{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
