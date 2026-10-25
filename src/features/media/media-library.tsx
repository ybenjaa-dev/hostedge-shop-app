"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CheckCircle2, Copy, ImageOff, Loader2, Search, Trash2, UploadCloud, X } from "lucide-react";
import { fileUrl } from "@/lib/storage";
import { formatBytes, uploadMedia, type MediaItem } from "@/lib/media-client";
import { useToast } from "@/components/toast";
import { deleteMediaAction, updateMediaAction } from "./actions";

type Page = { items: MediaItem[]; total: number; next: number | null };
type Upload = { id: string; name: string; state: "up" | "done" | "dup" | "error"; note?: string };
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
type Usage = { products: { id: string; name: string }[]; categories: number; offers: number; settings: boolean };

export function MediaLibrary({ mode, multiple = false, initial, onConfirm, onCancel, confirmLabel = "Use selected" }: {
  mode: "page" | "picker"; multiple?: boolean; initial?: Page; onConfirm?: (items: MediaItem[]) => void; onCancel?: () => void; confirmLabel?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [data, setData] = useState<Page>(initial ?? { items: [], total: 0, next: null });
  const [loading, setLoading] = useState(!initial);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [active, setActive] = useState<MediaItem | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [over, setOver] = useState(false);
  const first = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async (query: string, before?: number) => {
    setLoading(true);
    try {
      const u = new URLSearchParams();
      if (query) u.set("q", query);
      if (before) u.set("before", String(before));
      const r = await fetch(`/api/admin/media?${u}`);
      const j = (await r.json()) as Page & { ok: boolean };
      if (j.ok) setData((d) => (before ? { items: [...d.items, ...j.items], total: j.total, next: j.next } : { items: j.items, total: j.total, next: j.next }));
    } catch { toast("error", "Couldn’t load the library."); }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (first.current) { first.current = false; if (initial) return; }
    const t = setTimeout(() => void load(q), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, load, initial]);

  const selectedItems = sel.map((id) => data.items.find((i) => i.id === id)).filter(Boolean) as MediaItem[];
  const toggle = (it: MediaItem) => setSel((s) => (s.includes(it.id) ? s.filter((x) => x !== it.id) : multiple || mode === "page" ? [...s, it.id] : [it.id]));

  async function addFiles(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 100);
    if (!list.length) { if (files && (files as FileList).length) toast("error", "Only JPEG, PNG, WebP or AVIF images."); return; }
    const entries = list.map((f) => ({ file: f, id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}` }));
    setUploads((u) => [...entries.map((e) => ({ id: e.id, name: e.file.name, state: "up" as const })), ...u].slice(0, 30));
    const fresh: MediaItem[] = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < entries.length) {
        const e = entries[cursor++]!;
        const r = await uploadMedia(e.file);
        if (!r.ok) { setUploads((u) => u.map((x) => (x.id === e.id ? { ...x, state: "error", note: r.error } : x))); continue; }
        fresh.push(r.media);
        setUploads((u) => u.map((x) => (x.id === e.id ? { ...x, state: r.duplicate ? "dup" : "done", note: r.duplicate ? "Already in your library — reused" : undefined } : x)));
        setData((d) => (d.items.some((i) => i.id === r.media.id) ? d : { ...d, items: [r.media, ...d.items], total: d.total + 1 }));
      }
    };
    await Promise.all([worker(), worker()]);
    if (fresh.length) {
      if (mode === "picker") setSel((s) => (multiple ? [...new Set([...s, ...fresh.map((f) => f.id)])] : [fresh[0]!.id]));
      else setActive(fresh[0]!);
      if (mode === "page") router.refresh();
    }
  }

  const bulkDelete = async (force = false) => {
    if (!selectedItems.length) return;
    if (!force && !window.confirm(`Delete ${selectedItems.length} file${selectedItems.length === 1 ? "" : "s"} from the library? This can’t be undone.`)) return;
    const f = new FormData(); f.set("ids", JSON.stringify(selectedItems.map((i) => i.id))); if (force) f.set("force", "1");
    const r = await deleteMediaAction(undefined, f);
    if (r?.error) { toast("error", r.error); return; }
    toast("success", r?.message ?? "Deleted");
    const gone = new Set(selectedItems.map((i) => i.id));
    await load(q);
    setSel([]); setActive((a) => (a && gone.has(a.id) ? null : a));
    router.refresh();
  };

  return (
    <div className={mode === "picker" ? "flex min-h-0 flex-1 flex-col" : ""}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setOver(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setOver(false); }}
      onDrop={(e) => { e.preventDefault(); setOver(false); void addFiles(e.dataTransfer.files); }}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <label className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by file name…" aria-label="Search the media library" className="field !min-h-10 !ps-9" />
        </label>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => fileInput.current?.click()}><UploadCloud className="size-4" aria-hidden />Upload</button>
        <input ref={fileInput} type="file" multiple accept={ACCEPT} className="sr-only" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
        {mode === "page" && selectedItems.length > 0 && (
          <button type="button" className="btn btn-outline btn-sm text-danger" onClick={() => bulkDelete()}><Trash2 className="size-4" aria-hidden />Delete {selectedItems.length}</button>
        )}
        <span className="num ms-auto text-sm text-muted">{data.total} file{data.total === 1 ? "" : "s"}</span>
      </div>

      {uploads.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl border border-line bg-sunken p-2 text-sm" aria-label="Uploads">
          {uploads.slice(0, 6).map((u) => (
            <li key={u.id} className="flex items-center gap-2">
              {u.state === "up" && <Loader2 className="size-4 shrink-0 animate-spin text-muted" aria-hidden />}
              {u.state === "done" && <CheckCircle2 className="size-4 shrink-0 text-ok" aria-hidden />}
              {u.state === "dup" && <Copy className="size-4 shrink-0 text-brand" aria-hidden />}
              {u.state === "error" && <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />}
              <span className="min-w-0 flex-1 truncate">{u.name}</span>
              <span className={`shrink-0 text-xs ${u.state === "error" ? "text-danger" : "text-muted"}`}>{u.state === "up" ? "Compressing & uploading…" : u.note ?? "Uploaded"}</span>
            </li>
          ))}
          <li className="flex justify-end"><button type="button" className="text-xs font-semibold text-muted hover:text-ink" onClick={() => setUploads([])}>Clear</button></li>
        </ul>
      )}

      <div className={`mt-4 min-h-0 ${mode === "picker" ? "flex-1 overflow-y-auto" : ""} ${mode === "page" && active ? "lg:grid lg:grid-cols-[1fr_20rem] lg:gap-5" : ""}`}>
        <div className="relative min-w-0">
          {over && <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-brand bg-brand-soft/90 text-lg font-extrabold text-brand">Drop to upload</div>}
          {data.items.length === 0 && !loading ? (
            <div className="grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-line p-12 text-center">
              <ImageOff className="size-8 text-muted" aria-hidden />
              <p className="font-bold">{q ? "No files match your search" : "Your library is empty"}</p>
              <p className="max-w-sm text-sm text-muted">{q ? "Try another name." : "Drop images anywhere on this page, or press Upload. They are compressed to WebP with small thumbnails, and the same picture is never stored twice."}</p>
            </div>
          ) : (
            <ul className={`grid gap-3 ${mode === "page" && active ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`}>
              {data.items.map((it) => {
                const on = sel.includes(it.id);
                return (
                  <li key={it.id} className="group relative">
                    <button type="button" aria-pressed={on} aria-label={it.name}
                      onClick={() => (mode === "page" ? setActive(it) : toggle(it))}
                      onDoubleClick={() => { if (mode === "picker" && !multiple) onConfirm?.([it]); }}
                      className={`relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-sunken transition ${on || active?.id === it.id ? "border-brand shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_22%,transparent)]" : "border-line hover:border-ink/30"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fileUrl(it.key, "thumb")} alt={it.alt ?? ""} loading="lazy" decoding="async" className="size-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-start text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">{it.name}</span>
                    </button>
                    <button type="button" onClick={() => toggle(it)} aria-label={on ? `Deselect ${it.name}` : `Select ${it.name}`} aria-pressed={on}
                      className={`absolute start-1.5 top-1.5 grid size-6 place-items-center rounded-full border-2 transition ${on ? "border-brand bg-brand text-brand-ink" : "border-white/90 bg-black/30 text-transparent opacity-0 hover:text-white group-hover:opacity-100 focus-visible:opacity-100"}`}>
                      <Check className="size-3.5" strokeWidth={3.5} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {loading && <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted" role="status"><Loader2 className="size-4 animate-spin" aria-hidden />Loading…</p>}
          {data.next && !loading && <div className="mt-5 text-center"><button type="button" className="btn btn-outline btn-sm" onClick={() => load(q, data.next ?? undefined)}>Load more</button></div>}
        </div>
        {mode === "page" && active && <Detail key={active.id} item={active} onClose={() => setActive(null)} onChanged={(n) => { setData((d) => ({ ...d, items: d.items.map((i) => (i.id === n.id ? n : i)) })); setActive(n); }} onDeleted={async () => { setSel((s) => s.filter((x) => x !== active.id)); setActive(null); await load(q); router.refresh(); }} />}
      </div>

      {mode === "picker" && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-sm text-muted" aria-live="polite">{sel.length ? `${sel.length} selected` : multiple ? "Select one or more pictures" : "Select a picture"}</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
            <button type="button" className="btn btn-primary btn-sm" disabled={!sel.length} onClick={() => onConfirm?.(selectedItems)}>{confirmLabel}{multiple && sel.length ? ` (${sel.length})` : ""}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ item, onClose, onChanged, onDeleted }: { item: MediaItem; onClose: () => void; onChanged: (m: MediaItem) => void; onDeleted: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(item.name);
  const [alt, setAlt] = useState(item.alt ?? "");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    let live = true;
    fetch(`/api/admin/media?usage=${encodeURIComponent(item.key)}`).then((r) => r.json() as Promise<{ usage?: Usage }>).then((j) => { if (live && j.usage) setUsage(j.usage); }).catch(() => {});
    return () => { live = false; };
  }, [item.key]);
  const used = usage ? usage.products.length + usage.categories + usage.offers > 0 || usage.settings : false;
  const url = typeof window === "undefined" ? fileUrl(item.key) : `${window.location.origin}${fileUrl(item.key)}`;
  return (
    <aside className="mt-5 min-w-0 space-y-4 rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-4 lg:mt-0 lg:self-start" aria-label="File details">
      <div className="flex items-center justify-between"><h3 className="display font-extrabold">Details</h3><button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close details"><X className="size-4" /></button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="overflow-hidden rounded-xl border border-line bg-sunken"><img src={fileUrl(item.key, "md")} alt={item.alt ?? ""} className="mx-auto max-h-64 w-full object-contain" /></div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted">Size</dt><dd className="num font-semibold">{formatBytes(item.size)}{item.width && item.height ? ` · ${item.width}×${item.height}` : ""}</dd>
        <dt className="text-muted">Type</dt><dd className="font-semibold">{item.mime.replace("image/", "").toUpperCase()}{item.variants ? " · thumbnails ready" : ""}</dd>
        <dt className="text-muted">Added</dt><dd className="font-semibold">{new Date(item.createdAt).toLocaleDateString()}</dd>
      </dl>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const f = new FormData(); f.set("id", item.id); f.set("name", name); f.set("alt", alt); const r = await updateMediaAction(undefined, f); if (r?.error) toast("error", r.error); else { toast("success", "Saved"); onChanged({ ...item, name, alt: alt || null }); } }); }}>
        <div><label className="label" htmlFor="m-name">File name</label><input id="m-name" className="field !min-h-10" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} /></div>
        <div><label className="label" htmlFor="m-alt">Alt text</label><input id="m-alt" className="field !min-h-10" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} placeholder="Describe the picture (accessibility & SEO)" /></div>
        <button type="submit" className="btn btn-primary btn-sm w-full" disabled={pending || !name.trim() || (name === item.name && alt === (item.alt ?? ""))}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden />}Save changes</button>
      </form>
      <div>
        <p className="label">Where it’s used</p>
        {!usage ? <p className="text-xs text-muted">Checking…</p> : !used ? <p className="text-xs text-muted">Not used anywhere yet.</p> : (
          <ul className="space-y-0.5 text-xs">
            {usage.products.map((p) => <li key={p.id}><a className="font-semibold text-brand hover:underline" href={`/admin/products/${p.id}`}>{p.name}</a></li>)}
            {usage.categories > 0 && <li>{usage.categories} categor{usage.categories === 1 ? "y" : "ies"}</li>}
            {usage.offers > 0 && <li>{usage.offers} quantity offer{usage.offers === 1 ? "" : "s"}</li>}
            {usage.settings && <li>Store appearance (logo, hero…)</li>}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(url); toast("success", "Link copied"); } catch { toast("error", "Couldn’t copy"); } }}><Copy className="size-4" aria-hidden />Copy link</button>
        <button type="button" className="btn btn-outline btn-sm text-danger" onClick={async () => {
          if (!window.confirm(used ? "This picture is still in use. Deleting it will leave a broken image there. Delete anyway?" : "Delete this file? This can’t be undone.")) return;
          const f = new FormData(); f.set("ids", JSON.stringify([item.id])); if (used) f.set("force", "1");
          const r = await deleteMediaAction(undefined, f);
          if (r?.error) toast("error", r.error); else { toast("success", "Deleted"); onDeleted(); }
        }}><Trash2 className="size-4" aria-hidden />Delete</button>
      </div>
    </aside>
  );
}
