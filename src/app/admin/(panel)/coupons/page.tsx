import { asc, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { getDb, schema } from "@/db";
import { getSettings } from "@/lib/settings";
import { formatMoney, toMajorString } from "@/lib/money";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Toggle } from "@/features/admin/components/fields";
import { Badge, Empty, PageHeader, Stat } from "@/features/admin/components/ui";
import { DataTable } from "@/features/settings/components/table";
import { Drawer } from "@/features/admin/components/drawer";
import { nowMs } from "@/features/settings/lib";
import { ActionButton } from "@/features/settings/components/action-button";
import { CouponFields } from "@/features/catalog-admin/components/coupon-fields";
import { saveCoupon, deleteCoupon } from "@/features/catalog-admin/promo-actions";

export const metadata = { title: "Coupons" };
type Coupon = typeof schema.coupons.$inferSelect;
const day = (ms: number | null) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");
const short = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function CouponForm({ c, cur }: { c?: Coupon; cur: string }) {
  const k = c?.id ?? "new";
  const value = c ? (c.type === "fixed" ? toMajorString(c.value, cur) : c.type === "percent" ? String(c.value) : "") : "";
  return (
    <AdminForm action={saveCoupon} submitLabel={c ? "Save coupon" : "Create coupon"} resetOnSuccess={!c}>
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <CouponFields idp={k} currency={cur} initial={{ code: c?.code ?? "", type: c?.type ?? "percent", value, minSubtotal: toMajorString(c?.minSubtotal ?? 0, cur), maxUses: c?.maxUses != null ? String(c.maxUses) : "", startsAt: day(c?.startsAt ?? null), endsAt: day(c?.endsAt ?? null) }} />
      <Toggle name="active" label="Active" hint="Inactive coupons are rejected at checkout." defaultChecked={c?.active ?? true} />
    </AdminForm>
  );
}

export default async function CouponsPage() {
  await requirePerm("coupons.manage");
  const db = getDb();
  const s = await getSettings();
  const cur = s.store.currency;
  const coupons = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.active), asc(schema.coupons.code));
  const now = nowMs();
  const state = (c: Coupon) => {
    if (!c.active) return { label: "Inactive", color: "#64748b" };
    if (c.endsAt != null && c.endsAt < now) return { label: "Expired", color: "#dc2626" };
    if (c.maxUses != null && c.used >= c.maxUses) return { label: "Used up", color: "#d97706" };
    if (c.startsAt != null && c.startsAt > now) return { label: "Scheduled", color: "#2563eb" };
    return { label: "Live", color: "#16a34a" };
  };
  const live = coupons.filter((c) => state(c).label === "Live").length;
  const redeemed = coupons.reduce((a, c) => a + c.used, 0);
  const soon = coupons.filter((c) => state(c).label === "Live" && c.endsAt != null && c.endsAt - now < 7 * 864e5).length;
  return (
    <div className="space-y-5">
      <PageHeader title="Coupons" sub="Discount codes customers type at checkout. Quantity offers (“buy 2 for …”) are set up on each product."
        actions={<Drawer trigger={<><Plus className="size-4" aria-hidden />New coupon</>} triggerClassName="btn btn-primary btn-sm" title="New coupon" sub="Preview on top shows what customers see."><CouponForm cur={cur} /></Drawer>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Live coupons" value={live} />
        <Stat label="Redemptions" value={redeemed} />
        <Stat label="Ending in 7 days" value={soon} tone={soon ? "danger" : undefined} />
        <Stat label="All coupons" value={coupons.length} />
      </div>
      {coupons.length === 0 ? <Empty title="No coupons yet" hint="Create a code like WELCOME10 to reward first-time buyers." /> : (
        <DataTable minWidth="52rem" head={["Code", "Discount", "Conditions", "Usage", "Validity", "Status", { label: "", end: true, narrow: true }]}>
          {coupons.map((c) => {
            const st = state(c);
            const pct = c.maxUses ? Math.min(100, Math.round((c.used / c.maxUses) * 100)) : 0;
            return (
              <tr key={c.id}>
                <td><code className="rounded-md bg-sunken px-2 py-1 text-sm font-extrabold" dir="ltr">{c.code}</code></td>
                <td className="font-semibold">{c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${formatMoney(c.value, cur)} off` : "Free shipping"}</td>
                <td className="text-muted">{c.minSubtotal > 0 ? `Min ${formatMoney(c.minSubtotal, cur)}` : "None"}</td>
                <td className="min-w-32"><span className="num text-sm">{c.used}{c.maxUses != null ? ` / ${c.maxUses}` : ""}</span>{c.maxUses != null && <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sunken"><span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></span>}</td>
                <td className="whitespace-nowrap text-sm text-muted">{c.startsAt || c.endsAt ? `${c.startsAt ? short(c.startsAt) : "Now"} → ${c.endsAt ? short(c.endsAt) : "no end"}` : "Always"}</td>
                <td><Badge color={st.color}>{st.label}</Badge></td>
                <td className="is-end"><Drawer trigger="Edit" title={c.code} sub={`${c.used} redemption${c.used === 1 ? "" : "s"}`}>
                  <div className="space-y-6"><CouponForm c={c} cur={cur} />
                    <div className="border-t border-line pt-4"><ActionButton action={deleteCoupon} fields={{ id: c.id }} confirm={`Delete coupon ${c.code}?`} className="btn btn-ghost btn-sm text-danger">Delete coupon</ActionButton></div></div>
                </Drawer></td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
