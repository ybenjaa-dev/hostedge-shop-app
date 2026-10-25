"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Images, Loader2, Plus, Sparkles, Star, Tag, Trash2, Upload, Wand2 } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, I18nField, Toggle, uploadImage } from "@/features/admin/components/fields";
import { saveProductAction } from "./actions";
import { OfferTemplatePicker } from "./components/offer-template-picker";
import { OFFER_TEMPLATES } from "@/lib/offer-templates";
import { fileUrl } from "@/lib/storage";
import { MediaImageInput } from "@/features/media/image-input";
import { MediaPicker } from "@/features/media/media-picker";
import type { I18n } from "@/lib/i18n-core";

type Img = { key: string; alt: string | null };
type Offer = { qty: number; price: string; label: string; popular: boolean; image: string };
type Var = { id?: string; name: string; options: Record<string, string>; sku: string; price: string; stock: number };

export type ProductFormData = {
  id?: string; slug: string; name: I18n; shortDesc: I18n; longDesc: I18n; specs: I18n; seoTitle: I18n; seoDesc: I18n;
  categoryId: string; sku: string; price: string; compareAt: string; stock: number; trackStock: boolean; status: "draft" | "published"; featured: boolean; bestseller: boolean;
  images: Img[]; variants: Var[]; offers: Offer[]; offerTemplate: string;
};

const parseOptions = (s: string) => Object.fromEntries(s.split(/[;,]/).map((p) => p.split("=").map((x) => x.trim())).filter((p) => p[0] && p[1]) as [string, string][]);
const fmtOptions = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join("; ");

/** Small picture picker for one offer ("3-pack photo"). */
function OfferImage({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return <MediaImageInput label="Photo" value={value} onChange={onChange} fit="cover" size="size-11" compactLabel="Offer photo" />;
}

export function ProductForm({ data, categories, storeTemplate = "list" }: { data: ProductFormData; categories: { id: string; label: string }[]; storeTemplate?: string }) {
  const [images, setImages] = useState<Img[]>(data.images);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [variants, setVariants] = useState<Var[]>(data.variants);
  const [busy, setBusy] = useState(false);
  const [upErr, setUpErr] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const [dropOver, setDropOver] = useState(false);
  const [gen, setGen] = useState({ n1: "Size", v1: "", n2: "Color", v2: "" });
  const [offers, setOffers] = useState<Offer[]>(data.offers ?? []);
  const [base, setBase] = useState(parseFloat(data.price) || 0);
  useEffect(() => {
    const el = document.getElementById("pr") as HTMLInputElement | null;
    if (!el) return;
    const on = () => setBase(parseFloat(el.value.replace(",", ".")) || 0);
    el.addEventListener("input", on);
    return () => el.removeEventListener("input", on);
  }, []);
  const updOffer = (i: number, patch: Partial<Offer>) => setOffers((o) => o.map((x, k) => (k === i ? { ...x, ...patch } : patch.popular ? { ...x, popular: false } : x)));
  const suggest = () => setOffers([2, 3].map((q, i) => ({ qty: q, price: String(Math.round(base * q * (i === 0 ? 0.9 : 0.82))), label: "", popular: i === 0, image: "" })));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x!);
    setImages(next);
  };
  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setUpErr("");
    for (const f of Array.from(files).slice(0, 10)) {
      const r = await uploadImage(f);
      if (r.ok) setImages((x) => [...x.filter((i) => !i.key.startsWith("uploads/sample-")), { key: r.key, alt: null }]); else setUpErr(r.error);
    }
    setBusy(false);
  }
  function generate() {
    const a = gen.v1.split(",").map((s) => s.trim()).filter(Boolean);
    const b = gen.v2.split(",").map((s) => s.trim()).filter(Boolean);
    if (!a.length) return;
    const rows: Var[] = [];
    for (const x of a) for (const y of b.length ? b : [""]) {
      const options: Record<string, string> = { [gen.n1 || "Option"]: x };
      if (y) options[gen.n2 || "Option 2"] = y;
      rows.push({ name: y ? `${x} / ${y}` : x, options, sku: "", price: "", stock: 0 });
    }
    setVariants((v) => [...v, ...rows].slice(0, 100));
  }
  const upd = (i: number, patch: Partial<Var>) => setVariants((v) => v.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  return (
    <AdminForm action={saveProductAction} submitLabel={data.id ? "Save product" : "Create product"} className="space-y-5">
      {data.id && <input type="hidden" name="id" value={data.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="offers" value={JSON.stringify(offers.filter((o) => o.qty >= 2 && o.price).map((o) => ({ qty: o.qty, price: o.price, label: o.label, popular: o.popular, image: o.image })))} />
      <input type="hidden" name="variants" value={JSON.stringify(variants.map((v) => ({ ...v, price: v.price || null, sku: v.sku || null })))} />
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <I18nField label="Name" name="name" value={data.name} />
            <I18nField label="Short description" name="short" value={data.shortDesc} textarea rows={2} />
            <I18nField label="Long description" name="long" value={data.longDesc} textarea rows={5} />
            <I18nField label="Facts table (supplement facts / specs)" name="specs" value={data.specs} textarea rows={6} hint={'One row per line, written as "Label: value" — e.g. "Serving size: 1 capsule". Shown as a label-style table on the product page.'} />
          </section>

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="display text-lg font-extrabold">Images</h2><div className="flex flex-wrap gap-2"><button type="button" className="btn btn-primary btn-sm" onClick={() => setPickerOpen(true)}><Images className="size-4" aria-hidden />Media library</button><label className="btn btn-outline btn-sm cursor-pointer">{busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}Upload<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} /></label></div></div>
            {images.length === 0 ? <label onDragOver={(e) => { e.preventDefault(); setDropOver(true); }} onDragLeave={() => setDropOver(false)} onDrop={(e) => { e.preventDefault(); setDropOver(false); void addFiles(e.dataTransfer.files); }} className={`grid cursor-pointer place-items-center gap-1 rounded-xl border-2 border-dashed p-8 text-center text-sm transition ${dropOver ? "border-brand bg-brand-soft" : "border-line text-muted hover:border-ink/40"}`}><Upload className="size-6" aria-hidden /><span className="font-bold text-ink">Drop photos here or click to upload</span><span>JPEG, PNG, WebP or AVIF, up to 5 MB — compressed to WebP with thumbnails; pictures already in the library are reused, never stored twice. Square or 4:5 photos on a plain background look best.</span><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} /></label> : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((im, i) => (
                  <li key={im.key} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag != null) move(drag, i); setDrag(null); }} className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl border bg-sunken ${i === 0 ? "border-brand ring-2 ring-brand/30" : "border-line"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={fileUrl(im.key, "thumb")} alt="" className="size-full object-cover" />
                    {i === 0 && <span className="absolute start-1 top-1 rounded bg-brand px-1.5 text-[10px] font-extrabold text-brand-ink">MAIN</span>}
                    {im.key.startsWith("uploads/sample-") && <span className="absolute end-1 top-1 rounded bg-black/70 px-1.5 text-[10px] font-extrabold text-white">PLACEHOLDER</span>}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button type="button" aria-label="Move earlier" className="grid size-7 place-items-center rounded text-white hover:bg-white/20" onClick={() => move(i, i - 1)}><ArrowLeft className="size-4 rtl:rotate-180" /></button>
                      <button type="button" aria-label="Remove image" className="grid size-7 place-items-center rounded text-white hover:bg-red-500" onClick={() => setImages(images.filter((_, k) => k !== i))}><Trash2 className="size-4" /></button>
                      <button type="button" aria-label="Move later" className="grid size-7 place-items-center rounded text-white hover:bg-white/20" onClick={() => move(i, i + 1)}><ArrowRight className="size-4 rtl:rotate-180" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {upErr && <p className="err">{upErr}</p>}
            <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} multiple title="Choose product images" onPick={(items) => setImages((x) => [...x.filter((i) => !i.key.startsWith("uploads/sample-")), ...items.filter((it) => !x.some((i) => i.key === it.key)).map((it) => ({ key: it.key, alt: it.alt }))].slice(0, 20))} />
            <p className="mt-2 text-xs text-muted">Drag to reorder (or use the arrows). The first image is the main one. Uploading a real photo removes the placeholder illustration. Need many at once? Use <a href="/admin/media" className="font-bold text-brand underline">Media</a>.</p>
          </section>

          <section className="card p-5">
            <h2 className="display mb-1 text-lg font-extrabold">Variants</h2>
            <p className="mb-4 text-sm text-muted">Optional. Each variant has its own stock and (optionally) price. When variants exist the product-level stock is ignored.</p>
            <div className="mb-4 grid gap-2 rounded-xl bg-sunken p-3 sm:grid-cols-[1fr_2fr_1fr_2fr_auto]">
              <input aria-label="Option 1 name" className="field" value={gen.n1} onChange={(e) => setGen({ ...gen, n1: e.target.value })} placeholder="Size" />
              <input aria-label="Option 1 values" className="field" value={gen.v1} onChange={(e) => setGen({ ...gen, v1: e.target.value })} placeholder="S, M, L" />
              <input aria-label="Option 2 name" className="field" value={gen.n2} onChange={(e) => setGen({ ...gen, n2: e.target.value })} placeholder="Color" />
              <input aria-label="Option 2 values" className="field" value={gen.v2} onChange={(e) => setGen({ ...gen, v2: e.target.value })} placeholder="Black, White (optional)" />
              <button type="button" className="btn btn-outline" onClick={generate}><Wand2 className="size-4" />Generate</button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={v.id ?? i} className="grid items-end gap-2 rounded-xl border border-line p-3 sm:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto]">
                  <Field label="Name"><input className="field" value={v.name} onChange={(e) => upd(i, { name: e.target.value })} /></Field>
                  <Field label="Options"><input className="field" value={fmtOptions(v.options)} onChange={(e) => upd(i, { options: parseOptions(e.target.value) })} placeholder="Size=M; Color=Black" /></Field>
                  <Field label="SKU"><input className="field" value={v.sku} onChange={(e) => upd(i, { sku: e.target.value })} /></Field>
                  <Field label="Price"><input className="field" inputMode="decimal" value={v.price} onChange={(e) => upd(i, { price: e.target.value })} placeholder="= product" /></Field>
                  <Field label="Stock"><input className="field" type="number" min={0} value={v.stock} onChange={(e) => upd(i, { stock: Math.max(0, parseInt(e.target.value || "0", 10) || 0) })} /></Field>
                  <button type="button" aria-label="Remove variant" className="btn btn-ghost btn-sm text-danger" onClick={() => setVariants(variants.filter((_, k) => k !== i))}><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => setVariants([...variants, { name: "", options: {}, sku: "", price: "", stock: 0 }])}><Plus className="size-4" />Add variant</button>
          </section>

          <section className="card p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h2 className="display flex items-center gap-2 text-lg font-extrabold"><Tag className="size-5" aria-hidden />Quantity offers</h2>{offers.length === 0 && <button type="button" className="btn btn-outline btn-sm" onClick={suggest} disabled={base <= 0}><Sparkles className="size-4" />Suggest offers</button>}</div>
            <p className="mb-4 text-sm text-muted">Sell more per order with a fixed price for a bigger quantity — e.g. <b>1 for {base ? base.toFixed(0) : "129"}</b>, <b>2 for {base ? Math.round(base * 1.8) : 229}</b>, <b>3 for {base ? Math.round(base * 2.5) : 319}</b>. The customer sees them as selectable cards on the product page; 1 unit always costs the normal price.</p>
            <div className="space-y-2">
              {offers.map((o, i) => {
                const price = parseFloat(o.price.replace(",", ".")) || 0;
                const full = base * o.qty;
                const pct = full > 0 && price > 0 ? Math.round(((full - price) / full) * 100) : 0;
                const bad = price >= full && full > 0;
                return (
                  <div key={i} className="rounded-xl border border-line p-3">
                    <div className="flex flex-wrap items-end gap-2">
                      <OfferImage value={o.image} onChange={(k) => updOffer(i, { image: k })} />
                      <div className="w-20"><Field label="Buy"><input className="field" type="number" min={2} max={1000} value={o.qty} onChange={(e) => updOffer(i, { qty: Math.max(2, parseInt(e.target.value || "2", 10) || 2) })} /></Field></div>
                      <div className="min-w-[7.5rem] flex-1"><Field label="For (total price)"><input className="field" inputMode="decimal" value={o.price} onChange={(e) => updOffer(i, { price: e.target.value })} placeholder={base ? String(Math.round(base * o.qty * 0.9)) : ""} /></Field></div>
                      <div className="min-w-[7.5rem] flex-1"><Field label="Badge (optional)"><input className="field" maxLength={30} value={o.label} onChange={(e) => updOffer(i, { label: e.target.value })} placeholder="Family pack" /></Field></div>
                      <button type="button" aria-pressed={o.popular} className={`btn btn-sm ${o.popular ? "btn-primary" : "btn-outline"}`} onClick={() => updOffer(i, { popular: !o.popular })}><Star className="size-4" />Most popular</button>
                      <button type="button" aria-label="Remove offer" className="btn btn-ghost btn-sm text-danger" onClick={() => setOffers(offers.filter((_, k) => k !== i))}><Trash2 className="size-4" /></button>
                    </div>
                    {price > 0 && base > 0 && <p className={`mt-2 text-xs font-semibold ${bad ? "text-danger" : "text-ok"}`}>{bad ? `Must cost less than ${o.qty} × ${base.toFixed(2)} = ${full.toFixed(2)}.` : `${(price / o.qty).toFixed(2)} per unit · customer saves ${pct}% (${(full - price).toFixed(2)})`}</p>}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <p className="label mb-2">Offer card layout</p>
              <OfferTemplatePicker name="offerTemplate" value={data.offerTemplate ?? ""} allowDefault defaultLabel={OFFER_TEMPLATES.find((t) => t.id === storeTemplate)?.name} />
            </div>
            {offers.length < 6 && <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => { const q = (offers.at(-1)?.qty ?? 1) + 1; setOffers([...offers, { qty: q, price: base ? String(Math.round(base * q * 0.9)) : "", label: "", popular: false, image: "" }]); }}><Plus className="size-4" />Add offer</button>}
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="display text-lg font-extrabold">SEO</h2>
            <I18nField label="Meta title" name="seoTitle" value={data.seoTitle} />
            <I18nField label="Meta description" name="seoDesc" value={data.seoDesc} textarea rows={2} />
          </section>
        </div>

        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <Field label="Status" htmlFor="st"><select id="st" name="status" defaultValue={data.status} className="field"><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></Field>
            <Field label="Price" htmlFor="pr"><input id="pr" name="price" required inputMode="decimal" defaultValue={data.price} className="field" /></Field>
            <Field label="Compare-at price" htmlFor="cp" hint="Shown struck-through to display a discount."><input id="cp" name="compareAt" inputMode="decimal" defaultValue={data.compareAt} className="field" /></Field>
            <Field label="Category" htmlFor="ct"><select id="ct" name="categoryId" defaultValue={data.categoryId} className="field"><option value="">— None —</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
            <Field label="SKU" htmlFor="sk"><input id="sk" name="sku" defaultValue={data.sku} className="field" /></Field>
            <Field label="Stock (no variants)" htmlFor="sc"><input id="sc" name="stock" type="number" min={0} defaultValue={data.stock} className="field" /></Field>
            <Toggle name="trackStock" label="Track stock" hint="Off = always available." defaultChecked={data.trackStock} />
            <Toggle name="featured" label="Featured on home" defaultChecked={data.featured} />
            <Toggle name="bestseller" label="Mark as best seller" defaultChecked={data.bestseller} />
            <Field label="URL slug" htmlFor="sl" hint="Leave empty to generate from the name."><input id="sl" name="slug" defaultValue={data.slug} className="field" dir="ltr" /></Field>
          </section>
        </div>
      </div>
    </AdminForm>
  );
}
