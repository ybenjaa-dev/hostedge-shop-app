"use client";
import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, ImageField } from "@/features/admin/components/fields";
import { useLangMetas } from "@/components/lang-context";
import { sendPushAction, countAudienceAction } from "../actions";

/** Compose a message, pick who gets it, see how many devices that is, and send. */
export function PushCompose({ total, countries, cities, brand }: { total: number; countries: string[]; cities: string[]; brand: { name: string; icon: string } }) {
  const form = useRef<HTMLDivElement>(null);
  const metas = useLangMetas();
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [n, setN] = useState(total);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const recount = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const f = form.current?.closest("form"); if (!f) return;
      const fd = new FormData();
      for (const k of ["lang", "country", "city", "ordered"]) fd.set(k, (f.elements.namedItem(k) as HTMLInputElement | null)?.value ?? "");
      setN(await countAudienceAction(fd));
    }, 250);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <AdminForm action={sendPushAction} submitLabel={`Send to ${n} device${n === 1 ? "" : "s"}`} resetOnSuccess className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div ref={form} onChange={recount} className="space-y-4">
        <Field label="Title" htmlFor="pt"><input id="pt" name="title" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder="Flash sale −30% today" /></Field>
        <Field label="Message" htmlFor="pb" hint={`${body.length}/200 — keep it short; phones cut long text.`}><textarea id="pb" name="body" required rows={3} maxLength={200} value={body} onChange={(e) => setBody(e.target.value)} className="field" placeholder="Free delivery on every order until midnight." /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Opens (page or link)" htmlFor="pu" hint="Start with / for a page of your store."><input id="pu" name="url" maxLength={300} dir="ltr" className="field" placeholder="/shop or /p/my-product" /></Field>
          <ImageField label="Big picture (optional)" name="image" hint="Shown on Android/desktop. 2:1 works best." />
        </div>
        <fieldset className="rounded-2xl border border-line p-4">
          <legend className="label !px-1">Who receives it</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Language" htmlFor="pl"><select id="pl" name="lang" className="field" defaultValue=""><option value="">All</option>{metas.map((m) => <option key={m.code} value={m.code}>{m.native}</option>)}</select></Field>
            <Field label="Customers" htmlFor="po"><select id="po" name="ordered" className="field" defaultValue=""><option value="">Everyone</option><option value="yes">Already ordered</option><option value="no">Never ordered</option></select></Field>
            <Field label="Country" htmlFor="pc"><select id="pc" name="country" className="field" defaultValue=""><option value="">All</option>{countries.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="City" htmlFor="pci"><select id="pci" name="city" className="field" defaultValue=""><option value="">All</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-brand" aria-hidden />{n} subscribed device{n === 1 ? "" : "s"} match</p>
        </fieldset>
      </div>
      <div aria-hidden className="lg:sticky lg:top-24 lg:self-start">
        <p className="label">Preview</p>
        <div className="rounded-2xl border border-line bg-sunken p-3 shadow-sm">
          <div className="flex gap-3 rounded-xl bg-surface p-3 shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {brand.icon ? <img src={brand.icon} alt="" className="size-10 shrink-0 rounded-lg object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-ink">{brand.name.slice(0, 1)}</span>}
            <div className="min-w-0"><p className="text-[11px] text-muted">{brand.name} · now</p><p className="truncate text-sm font-bold">{title || "Your title"}</p><p className="line-clamp-2 text-xs text-muted">{body || "Your message appears here."}</p></div>
          </div>
        </div>
      </div>
    </AdminForm>
  );
}
