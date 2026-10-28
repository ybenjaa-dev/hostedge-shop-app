"use client";
import { Check, Plus } from "lucide-react";
import { tr } from "@/lib/i18n-core";
import { fileUrl } from "@/lib/storage";
import type { Companion } from "@/features/catalog/links";
import { useStore, useT } from "../store-context";

/** "Frequently bought together": thumbnails joined by plus signs, a tick per companion and the combined total. Ticked items go into the same order. */
export function TogetherCard({ items, skipped, onToggle, mainName, mainImage, mainTotal, fmt }: { items: Companion[]; skipped: string[]; onToggle: (id: string) => void; mainName: string; mainImage: string | null; mainTotal: number; fmt: (n: number) => string }) {
  const st = useStore();
  const t = useT();
  const on = items.filter((c) => !skipped.includes(c.id));
  const total = mainTotal + on.reduce((n, c) => n + c.price, 0);
  return (
    <section className="together mt-6 rounded-2xl border border-line bg-surface p-4" aria-label={t("together.title")}>
      <h3 className="display text-base font-extrabold">{t("together.title")}</h3>
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1" aria-hidden>
        <Thumb src={mainImage} />
        {items.map((c) => (<span key={c.id} className="flex items-center gap-1.5"><Plus className="size-4 shrink-0 text-muted" /><span className={skipped.includes(c.id) ? "opacity-30" : ""}><Thumb src={c.image} /></span></span>))}
      </div>
      <ul className="mt-3 space-y-2">
        <li className="flex items-center gap-3 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand text-brand-ink"><Check className="size-4" aria-hidden /></span><span className="min-w-0 flex-1 truncate font-semibold">{mainName} <span className="font-normal text-muted">· {t("together.this")}</span></span></li>
        {items.map((c) => {
          const checked = !skipped.includes(c.id);
          return (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => onToggle(c.id)} />
                <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-line bg-surface text-transparent transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand"><Check className="size-4" /></span>
                <span className="min-w-0 flex-1 truncate">{tr(c.name, st.lang) || c.slug}{c.variantName ? <span className="text-muted"> · {c.variantName}</span> : null}</span>
                <span dir="ltr" className="num shrink-0 font-bold">{fmt(c.price)}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-sm"><span className="font-semibold text-muted">{t("together.total", { n: on.length + 1 })}</span><span dir="ltr" className="num display text-lg font-extrabold">{fmt(total)}</span></p>
      <p className="mt-1 text-xs text-muted">{t("together.hint")}</p>
    </section>
  );
}

function Thumb({ src }: { src: string | null }) {
  return <span className="block size-16 shrink-0 overflow-hidden rounded-xl border border-line bg-sunken">{src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(src, "thumb")} alt="" className="size-full object-cover" loading="lazy" /> : null}</span>;
}
