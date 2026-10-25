"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkProductsAction } from "./actions";
import { useToast } from "@/components/toast";
import { fileUrl } from "@/lib/storage";
import { formatMoney } from "@/lib/money";
import { tr } from "@/lib/i18n-core";
import { Badge } from "@/features/admin/components/ui";
import type { AdminProductRow } from "./queries";

export function ProductsTable({ rows, currency, categories }: { rows: AdminProductRow[]; currency: string; categories: { id: string; label: string }[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [op, setOp] = useState("");
  const [val, setVal] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const ids = [...sel];
  const needsValue = ["category", "price_pct", "price_set", "stock_add", "stock_set"].includes(op);
  const apply = () => {
    if (op === "delete" && !confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return;
    start(async () => {
      const r = await bulkProductsAction({ ids, op, value: val });
      toast(r?.ok ? "success" : "error", r?.message ?? r?.error ?? "Failed");
      if (r?.ok) { setSel(new Set()); setOp(""); setVal(""); router.refresh(); }
    });
  };
  return (
    <div>
      {sel.size > 0 && (
        <div className="sticky top-16 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-brand bg-brand-soft p-3 shadow-lg" role="toolbar" aria-label="Bulk edit">
          <b className="text-sm">{sel.size} selected</b>
          <select aria-label="Bulk action" className="field !min-h-9 !w-auto !py-1 text-sm" value={op} onChange={(e) => { setOp(e.target.value); setVal(""); }}>
            <option value="">Bulk edit…</option><option value="publish">Publish</option><option value="draft">Set to draft</option><option value="featured_on">Feature on home</option><option value="featured_off">Unfeature</option><option value="category">Set category</option><option value="price_pct">Change price by %</option><option value="price_set">Set price</option><option value="stock_add">Add stock</option><option value="stock_set">Set stock</option><option value="delete">Delete</option>
          </select>
          {op === "category" && <select aria-label="Category" className="field !min-h-9 !w-auto !py-1 text-sm" value={val} onChange={(e) => setVal(e.target.value)}><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>}
          {needsValue && op !== "category" && <input aria-label="Value" className="field !min-h-9 !w-28 !py-1 text-sm" value={val} onChange={(e) => setVal(e.target.value)} placeholder={op === "price_pct" ? "-10 or 15" : "value"} inputMode="decimal" />}
          <button className={`btn btn-sm ${op === "delete" ? "btn-danger" : "btn-primary"}`} disabled={pending || !op} onClick={apply}>{pending && <span className="spinner" />}Apply</button>
          <button className="btn btn-ghost btn-sm ms-auto" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}
      <div className="card overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="border-b border-line bg-sunken/60 text-xs uppercase tracking-wider text-muted"><tr>
            <th className="w-10 p-3"><input type="checkbox" aria-label="Select all" className="size-4 accent-[var(--brand)]" checked={rows.length > 0 && sel.size === rows.length} onChange={() => setSel(sel.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)))} /></th>
            <th className="p-3 text-start">Product</th><th className="p-3 text-start">Status</th><th className="p-3 text-start">Category</th><th className="p-3 text-end">Stock</th><th className="p-3 text-end">Price</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className={`hover:bg-sunken/50 ${sel.has(r.id) ? "bg-brand-soft" : ""}`}>
                <td className="p-3"><input type="checkbox" aria-label={`Select ${tr(r.name, "en")}`} className="size-4 accent-[var(--brand)]" checked={sel.has(r.id)} onChange={() => setSel((s) => { const n = new Set(s); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} /></td>
                <td className="p-3"><Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.image ? <img src={fileUrl(r.image)} alt="" className="size-11 rounded-lg object-cover" /> : <span className="size-11 rounded-lg bg-sunken" />}
                  <span><span className="block font-semibold hover:text-brand">{tr(r.name, "en")}</span><span className="text-xs text-muted">{r.sku ?? r.slug}{r.variants ? ` · ${r.variants} variants` : ""}</span></span></Link></td>
                <td className="p-3"><Badge color={r.status === "published" ? "#16a34a" : "#64748b"}>{r.status}</Badge></td>
                <td className="p-3 text-muted">{r.category ? tr(r.category, "en") : "—"}</td>
                <td className={`num p-3 text-end font-semibold ${r.stock <= 0 ? "text-danger" : r.stock < 5 ? "text-accent" : ""}`}>{r.stock}</td>
                <td dir="ltr" className="num p-3 text-end font-bold">{formatMoney(r.price, currency, "en")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
