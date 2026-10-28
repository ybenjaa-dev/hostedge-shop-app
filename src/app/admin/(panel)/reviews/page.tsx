import { Tabs } from "@/features/settings/components/tabs";
import { desc, eq, sql } from "drizzle-orm";
import { Check, EyeOff, Star, Trash2 } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { tr } from "@/lib/i18n-core";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { Badge, Empty, PageHeader, Pager, Panel } from "@/features/admin/components/ui";
import { ActionButton } from "@/features/settings/components/action-button";
import { one, pageNum } from "@/features/settings/lib";
import { addReview, deleteReview, setReviewStatus } from "@/features/catalog-admin/review-actions";

export const metadata = { title: "Reviews" };
const PER = 25;
const FILTERS = [["pending", "Pending"], ["approved", "Approved"], ["hidden", "Hidden"], ["all", "All"]] as const;
const COLORS = { pending: "#d97706", approved: "#16a34a", hidden: "#64748b" } as const;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requirePerm("reviews.moderate");
  const sp = await searchParams;
  const status = FILTERS.some((f) => f[0] === one(sp.status)) ? one(sp.status) : "pending";
  const page = pageNum(sp.page);
  const db = getDb();
  const where = status === "all" ? undefined : eq(schema.reviews.status, status as "pending" | "approved" | "hidden");
  const [rows, total, counts, prods] = await Promise.all([
    db.select({ r: schema.reviews, product: schema.products.name }).from(schema.reviews).leftJoin(schema.products, eq(schema.products.id, schema.reviews.productId)).where(where).orderBy(desc(schema.reviews.createdAt)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)` }).from(schema.reviews).where(where).get(),
    db.select({ s: schema.reviews.status, n: sql<number>`count(*)` }).from(schema.reviews).groupBy(schema.reviews.status),
    db.select({ id: schema.products.id, name: schema.products.name }).from(schema.products).orderBy(schema.products.slug).limit(500),
  ]);
  const cnt = Object.fromEntries(counts.map((c) => [c.s, c.n]));
  return (
    <div>
      <PageHeader title="Reviews" sub="Moderate customer reviews before they appear in the store." />
      <Tabs base="/admin/reviews" label="Filter reviews" current={status} items={FILTERS.map(([id, label]) => ({ id, href: `/admin/reviews?status=${id}`, label: <>{label}{id !== "all" && <span className="num ms-1.5 rounded-full bg-sunken px-1.5 text-xs">{cnt[id] ?? 0}</span>}</> }))} />
      <Panel className="mb-6">
        <details data-keep-open>
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 font-bold"><Star className="size-4" aria-hidden />Add a review manually</summary>
          <div className="mt-4"><AdminForm action={addReview} submitLabel="Add review" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product" htmlFor="rv-prod"><select id="rv-prod" name="productId" required className="field" defaultValue=""><option value="" disabled>Choose…</option>{prods.map((p) => <option key={p.id} value={p.id}>{tr(p.name, "en") || p.id}</option>)}</select></Field>
              <Field label="Rating" htmlFor="rv-rate"><select id="rv-rate" name="rating" className="field" defaultValue="5">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}</select></Field>
              <Field label="Customer name" htmlFor="rv-name"><input id="rv-name" name="name" required maxLength={80} className="field" /></Field>
              <Field label="City" htmlFor="rv-city"><input id="rv-city" name="city" maxLength={80} className="field" /></Field>
            </div>
            <Field label="Review" htmlFor="rv-body"><textarea id="rv-body" name="body" required rows={3} maxLength={2000} className="field" /></Field>
          </AdminForm></div>
        </details>
      </Panel>
      {rows.length === 0 ? <Empty title={status === "pending" ? "Nothing to moderate" : "No reviews here"} hint="New customer reviews will show up in this list." /> : (
        <ul className="space-y-3">{rows.map(({ r, product }) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex" role="img" aria-label={`${r.rating} of 5 stars`}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < r.rating ? "fill-accent text-accent" : "text-line"}`} aria-hidden />)}</span>
              <Badge color={COLORS[r.status]}>{r.status}</Badge>
              <span className="text-xs text-muted">{product ? tr(product, "en") : "—"} · {new Date(r.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
            <p className="mt-2 whitespace-pre-line">{r.body}</p>
            <p className="mt-1 text-sm font-semibold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== "approved" && <ActionButton action={setReviewStatus} fields={{ id: r.id, status: "approved" }} className="btn btn-primary btn-sm"><Check className="size-4" aria-hidden />Approve</ActionButton>}
              {r.status !== "hidden" && <ActionButton action={setReviewStatus} fields={{ id: r.id, status: "hidden" }}><EyeOff className="size-4" aria-hidden />Hide</ActionButton>}
              <ActionButton action={deleteReview} fields={{ id: r.id }} confirm="Delete this review permanently?" className="btn btn-ghost btn-sm text-danger"><Trash2 className="size-4" aria-hidden />Delete</ActionButton>
            </div>
          </li>
        ))}</ul>
      )}
      <Pager page={page} pages={Math.max(1, Math.ceil((total?.n ?? 0) / PER))} base="/admin/reviews" params={{ status }} />
    </div>
  );
}
