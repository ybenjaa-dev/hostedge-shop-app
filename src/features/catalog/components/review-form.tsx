"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/features/checkout/actions";
import { useT } from "@/features/checkout/store-context";

export function ReviewForm({ productId }: { productId: string }) {
  const t = useT();
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (msg) return <p className="rounded-xl bg-brand-soft p-4 font-medium" role="status">{msg}</p>;
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const f = new FormData(e.currentTarget);
        setBusy(true);
        const r = await submitReview({ productId, name: f.get("name"), rating, body: f.get("body"), hp: f.get("website") });
        setBusy(false);
        setMsg(r.ok ? (r.pending === false ? "✓" : t("p.reviewThanks")) : t("common.error"));
      }}
    >
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -start-[9999px]" />
      <div>
        <label className="label" htmlFor="rv-name">{t("p.yourName")}</label>
        <input id="rv-name" name="name" required minLength={2} maxLength={60} className="field" autoComplete="name" />
      </div>
      <div role="radiogroup" aria-label={t("p.rating")} className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)} className="p-1"><Star className={`size-7 ${n <= rating ? "fill-accent text-accent" : "text-line"}`} /></button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="rv-body">{t("p.yourReview")}</label>
        <textarea id="rv-body" name="body" required minLength={3} maxLength={1000} rows={3} className="field" />
      </div>
      <button className="btn btn-outline" disabled={busy}>{busy && <span className="spinner" />}{t("p.submitReview")}</button>
    </form>
  );
}
