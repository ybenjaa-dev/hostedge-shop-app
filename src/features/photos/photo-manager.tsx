"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, Plus, Replace, Sparkles, UploadCloud, X } from "lucide-react";
import { uploadImage } from "@/features/admin/components/fields";
import { useToast } from "@/components/toast";
import { fileUrl } from "@/lib/storage";
import { matchPhoto } from "@/lib/photo-match";
import { attachProductPhotos, setCategoryPhoto } from "./actions";
import type { PhotoCategory, PhotoProduct } from "./queries";

type Row = { id: string; file: File; preview: string; productId: string; slot: number; mode: "main" | "add"; state: "idle" | "up" | "done" | "error"; note?: string };
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

function Thumb({ k, alt, ratio = "aspect-[4/5]" }: { k: string | null; alt: string; ratio?: string }) {
  return (
    <div className={`relative ${ratio} overflow-hidden rounded-xl border border-line bg-sunken`}>
      {k ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={fileUrl(k)} alt={alt} loading="lazy" className="size-full object-cover" /> : <div className="grid size-full place-items-center text-muted"><ImagePlus className="size-7" aria-hidden /></div>}
    </div>
  );
}

export function PhotoManager({ products, categories }: { products: PhotoProduct[]; categories: PhotoCategory[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [filter, setFilter] = useState<"all" | "todo">("todo");
  const matchList = useMemo(() => products.map((p) => ({ id: p.id, slug: p.slug, sku: p.sku, names: p.names })), [products]);

  function addFiles(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 100);
    if (!list.length) return;
    setRows((cur) => [...cur, ...list.map((file) => {
      const m = matchPhoto(file.name, matchList);
      return { id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`, file, preview: URL.createObjectURL(file), productId: m?.productId ?? "", slot: m?.slot ?? 1, mode: (m && m.slot > 1 ? "add" : "main") as "main" | "add", state: "idle" as const };
    })]);
  }
  const patch = (id: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const ready = rows.filter((r) => r.productId && r.state !== "done");

  async function applyAll() {
    setBusy("bulk");
    const done: { productId: string; key: string; mode: "main" | "add" }[] = [];
    // upload sequentially (kind to the 5 MB / rate limits); the first photo per product goes "main" before the extras
    for (const r of [...ready].sort((a, b) => (a.mode === b.mode ? a.slot - b.slot : a.mode === "main" ? -1 : 1))) {
      patch(r.id, { state: "up" });
      const up = await uploadImage(r.file);
      if (!up.ok) { patch(r.id, { state: "error", note: up.error }); continue; }
      done.push({ productId: r.productId, key: up.key, mode: r.mode });
      patch(r.id, { state: "done" });
    }
    if (done.length) {
      const f = new FormData(); f.set("items", JSON.stringify(done));
      const res = await attachProductPhotos(undefined, f);
      if (res?.error) toast("error", res.error); else toast("success", res?.message ?? "Photos added");
      router.refresh();
    }
    setBusy(null);
  }

  async function one(p: PhotoProduct, file: File | undefined, mode: "main" | "add") {
    if (!file) return;
    setBusy(p.id);
    const up = await uploadImage(file);
    if (!up.ok) { toast("error", up.error); setBusy(null); return; }
    const f = new FormData(); f.set("items", JSON.stringify([{ productId: p.id, key: up.key, mode }]));
    const res = await attachProductPhotos(undefined, f);
    if (res?.error) toast("error", res.error); else toast("success", "Photo saved");
    setBusy(null); router.refresh();
  }
  async function cat(c: PhotoCategory, file: File | undefined) {
    if (!file) return;
    setBusy(c.id);
    const up = await uploadImage(file);
    if (!up.ok) { toast("error", up.error); setBusy(null); return; }
    const f = new FormData(); f.set("id", c.id); f.set("key", up.key);
    const res = await setCategoryPhoto(undefined, f);
    if (res?.error) toast("error", res.error); else toast("success", "Category photo saved");
    setBusy(null); router.refresh();
  }

  const shown = products.filter((p) => filter === "all" || p.sample);
  const todo = products.filter((p) => p.sample).length;
  const fileBtn = "btn btn-outline btn-sm cursor-pointer";
  return (
    <div className="space-y-8">
      {/* bulk dropzone */}
      <section aria-labelledby="bulk-h" className="card p-5">
        <h2 id="bulk-h" className="display flex items-center gap-2 text-lg font-extrabold"><Sparkles className="size-5 text-brand" aria-hidden />Add many photos at once</h2>
        <p className="mt-1 text-sm text-muted">Drop a whole folder of photos. Name each file after the product — its <b>slug</b>, <b>SKU</b> or <b>name</b> (<code className="rounded bg-sunken px-1">ceramic-pan-set.jpg</code>) — and add <code className="rounded bg-sunken px-1">-2</code>, <code className="rounded bg-sunken px-1">-3</code> for extra photos. You review the matches before anything is saved.</p>
        <label onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
          className={`mt-4 grid cursor-pointer place-items-center gap-1 rounded-2xl border-2 border-dashed p-8 text-center transition ${over ? "border-brand bg-brand-soft" : "border-line bg-sunken hover:border-ink/40"}`}>
          <UploadCloud className="size-8 text-muted" aria-hidden />
          <span className="font-bold">Drop photos here or click to choose</span>
          <span className="text-xs text-muted">JPEG, PNG, WebP or AVIF · up to 5 MB each · resized to WebP in your browser · up to 100 at a time</span>
          <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
        </label>

        {rows.length > 0 && (
          <div className="mt-5">
            <ul className="divide-y divide-line rounded-xl border border-line">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.preview} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1 basis-40"><p className="truncate text-sm font-semibold">{r.file.name}</p><p className="text-xs text-muted">{r.file.size >= 1048576 ? `${(r.file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(r.file.size / 1024))} KB`}</p></div>
                  <select aria-label={`Product for ${r.file.name}`} className="field !min-h-10 min-w-0 flex-1 basis-48" value={r.productId} onChange={(e) => patch(r.id, { productId: e.target.value })} disabled={r.state === "done" || busy === "bulk"}>
                    <option value="">— choose a product —</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select aria-label="Photo role" className="field !min-h-10 w-40" value={r.mode} onChange={(e) => patch(r.id, { mode: e.target.value as "main" | "add" })} disabled={r.state === "done" || busy === "bulk"}>
                    <option value="main">Main photo</option><option value="add">Extra photo</option>
                  </select>
                  <span className="w-24 text-sm font-semibold" role="status">
                    {r.state === "up" && <span className="inline-flex items-center gap-1 text-muted"><Loader2 className="size-4 animate-spin" aria-hidden />Uploading</span>}
                    {r.state === "done" && <span className="inline-flex items-center gap-1 text-ok"><CheckCircle2 className="size-4" aria-hidden />Saved</span>}
                    {r.state === "error" && <span className="text-danger" title={r.note}>Failed</span>}
                    {r.state === "idle" && !r.productId && <span className="text-danger">No match</span>}
                  </span>
                  <button type="button" aria-label="Remove" className="btn btn-ghost btn-sm" onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))} disabled={busy === "bulk"}><X className="size-4" /></button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" className="btn btn-primary" disabled={!ready.length || busy === "bulk"} onClick={applyAll}>{busy === "bulk" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UploadCloud className="size-4" aria-hidden />}Upload {ready.length} photo{ready.length === 1 ? "" : "s"}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setRows([])} disabled={busy === "bulk"}>Clear list</button>
              {rows.length > ready.length && rows.some((r) => !r.productId) && <span className="text-sm text-muted">Files without a match are skipped — pick a product for them or remove them.</span>}
            </div>
          </div>
        )}
      </section>

      {/* products */}
      <section aria-labelledby="prod-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="prod-h" className="display text-lg font-extrabold">Products <span className="text-sm font-semibold text-muted">· {todo} of {products.length} still need a real photo</span></h2>
          <div className="flex gap-1.5" role="group" aria-label="Filter">
            {([["todo", "Needs photo"], ["all", "All"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${filter === k ? "border-brand bg-brand-soft text-brand" : "border-line"}`}>{l}</button>)}
          </div>
        </div>
        {shown.length === 0 ? <p className="card p-6 text-center text-muted">Every product has its own photo. Nice work.</p> : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((p) => (
              <li key={p.id} className="card p-2.5">
                <div className="relative"><Thumb k={p.image} alt={p.name} />{p.sample && <span className="absolute start-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">{p.count === 0 ? "No photo" : "Placeholder"}</span>}{busy === p.id && <span className="absolute inset-0 grid place-items-center rounded-xl bg-bg/70"><Loader2 className="size-6 animate-spin" aria-hidden /></span>}</div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{p.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <label className={fileBtn}><Replace className="size-4" aria-hidden />{p.sample ? "Add photo" : "Replace"}<input type="file" accept={ACCEPT} className="sr-only" disabled={!!busy} onChange={(e) => { void one(p, e.target.files?.[0], "main"); e.target.value = ""; }} /></label>
                  {!p.sample && <label className={fileBtn} title="Add another photo"><Plus className="size-4" aria-hidden />Add<input type="file" accept={ACCEPT} className="sr-only" disabled={!!busy} onChange={(e) => { void one(p, e.target.files?.[0], "add"); e.target.value = ""; }} /></label>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* categories */}
      <section id="categories" aria-labelledby="cat-h" className="scroll-mt-24">
        <h2 id="cat-h" className="display mb-3 text-lg font-extrabold">Categories <span className="text-sm font-semibold text-muted">· shown as tiles on the home page</span></h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <li key={c.id} className="card p-2.5">
              <div className="relative"><Thumb k={c.image} alt={c.name} ratio="aspect-[4/3]" />{c.sample && <span className="absolute start-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">{c.image ? "Placeholder" : "No photo"}</span>}{busy === c.id && <span className="absolute inset-0 grid place-items-center rounded-xl bg-bg/70"><Loader2 className="size-6 animate-spin" aria-hidden /></span>}</div>
              <p className="mt-2 truncate text-sm font-semibold">{c.name}</p>
              <label className={`${fileBtn} mt-2`}><Replace className="size-4" aria-hidden />{c.sample ? "Add photo" : "Replace"}<input type="file" accept={ACCEPT} className="sr-only" disabled={!!busy} onChange={(e) => { void cat(c, e.target.files?.[0]); e.target.value = ""; }} /></label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
