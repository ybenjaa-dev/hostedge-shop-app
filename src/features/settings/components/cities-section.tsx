import Link from "next/link";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { Pencil, Plus } from "lucide-react";
import { getDb, schema } from "@/db";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field, Toggle } from "@/features/admin/components/fields";
import { Panel, Pager, Empty, Badge } from "@/features/admin/components/ui";
import type { Settings } from "@/lib/settings";
import { countryByCode } from "@/lib/phone";
import { formatMoney, toMajorString } from "@/lib/money";
import { saveCity, deleteCity, bulkCityFee } from "../actions/cities";
import { ActionButton } from "./action-button";

const PER = 40;
type City = typeof schema.cities.$inferSelect;

function CityForm({ city, country, cur, regions }: { city?: City; country: string; cur: string; regions: string[] }) {
  const id = city?.id ?? "new";
  return (
    <AdminForm action={saveCity} submitLabel={city ? "Save city" : "Add city"} resetOnSuccess={!city} className="space-y-4">
      <input type="hidden" name="id" value={city?.id ?? ""} /><input type="hidden" name="country" value={country} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name" htmlFor={`cn-${id}`}><input id={`cn-${id}`} name="name" defaultValue={city?.name} required maxLength={80} className="field" /></Field>
        <Field label="Name (Arabic)" htmlFor={`ca-${id}`}><input id={`ca-${id}`} name="nameAr" defaultValue={city?.nameAr ?? ""} dir="rtl" maxLength={80} className="field" /></Field>
        <Field label="Region" htmlFor={`cr-${id}`}><input id={`cr-${id}`} name="region" list="regions-list" defaultValue={city?.region ?? ""} maxLength={80} className="field" /></Field>
        <Field label={`Shipping fee (${cur})`} htmlFor={`cf-${id}`} hint="Empty = default fee"><input id={`cf-${id}`} name="fee" inputMode="decimal" defaultValue={city?.fee != null ? toMajorString(city.fee, cur) : ""} className="field num" /></Field>
        <Field label={`Free above (${cur})`} htmlFor={`cb-${id}`} hint="Empty = store threshold"><input id={`cb-${id}`} name="freeAbove" inputMode="decimal" defaultValue={city?.freeAbove != null ? toMajorString(city.freeAbove, cur) : ""} className="field num" /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle name="codAvailable" label="Cash on delivery available" defaultChecked={city?.codAvailable ?? true} />
        <Toggle name="active" label="Active" defaultChecked={city?.active ?? true} />
      </div>
      <datalist id="regions-list">{regions.map((r) => <option key={r} value={r} />)}</datalist>
    </AdminForm>
  );
}

export async function CitiesSection({ s, sp }: { s: Settings; sp: { country?: string; q?: string; page?: string } }) {
  const cur = s.store.currency;
  const country = s.store.countries.includes(sp.country ?? "") ? sp.country! : s.store.countries[0] ?? s.store.country;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const db = getDb();
  const where = and(eq(schema.cities.country, country), q ? or(like(schema.cities.name, `%${q}%`), like(schema.cities.nameAr, `%${q}%`), like(schema.cities.region, `%${q}%`)) : undefined);
  const [rows, total, regionRows] = await Promise.all([
    db.select().from(schema.cities).where(where).orderBy(asc(schema.cities.position), asc(schema.cities.name)).limit(PER).offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)` }).from(schema.cities).where(where).get(),
    db.selectDistinct({ r: schema.cities.region }).from(schema.cities).where(eq(schema.cities.country, country)),
  ]);
  const regions = regionRows.map((r) => r.r).filter((r): r is string => !!r).sort();
  const pages = Math.max(1, Math.ceil((total?.n ?? 0) / PER));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {s.store.countries.map((c) => (
          <Link key={c} href={`/admin/settings?tab=cities&country=${c}`} aria-current={c === country ? "true" : undefined}
            className={`btn btn-sm ${c === country ? "btn-primary" : "btn-outline"}`}>{countryByCode(c)?.flag} {countryByCode(c)?.name.en ?? c}</Link>
        ))}
        <form action="/admin/settings" className="ms-auto flex gap-2" role="search">
          <input type="hidden" name="tab" value="cities" /><input type="hidden" name="country" value={country} />
          <input name="q" defaultValue={q} placeholder="Search cities…" aria-label="Search cities" className="field !min-h-9 w-44" />
          <button className="btn btn-outline btn-sm">Search</button>
        </form>
      </div>

      <Panel title="Bulk set shipping fee">
        <AdminForm action={bulkCityFee} submitLabel="Apply fee" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="country" value={country} />
          <Field label="Region" htmlFor="bulk-region"><select id="bulk-region" name="region" className="field"><option value="__all">All cities in country</option>{regions.map((r) => <option key={r} value={r}>{r}</option>)}<option value="__none">Cities without a region</option></select></Field>
          <Field label={`Fee (${cur}) — empty = default`} htmlFor="bulk-fee"><input id="bulk-fee" name="fee" inputMode="decimal" className="field num" /></Field>
        </AdminForm>
      </Panel>

      <Panel title={`Cities (${total?.n ?? 0})`} actions={null}>
        <details data-keep-open className="mb-4 rounded-xl border border-line">
          <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-4 text-sm font-bold"><Plus className="size-4" />Add a city</summary>
          <div className="border-t border-line p-4"><CityForm country={country} cur={cur} regions={regions} /></div>
        </details>
        {rows.length === 0 ? <Empty title="No cities" hint={q ? "Nothing matches your search." : "Add a city so customers in this country can order."} /> : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id}>
                <details data-keep-open className="group">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.name}{c.nameAr && <span className="ms-2 text-sm font-normal text-muted" dir="rtl">{c.nameAr}</span>}</span>
                      <span className="text-xs text-muted">{c.region ?? "—"}</span></span>
                    <span className="num text-sm font-semibold">{c.fee != null ? formatMoney(c.fee, cur) : <span className="text-muted">default</span>}</span>
                    {!c.codAvailable && <Badge color="#d97706">No COD</Badge>}{!c.active && <Badge>Hidden</Badge>}
                    <Pencil className="size-4 text-muted group-open:text-brand" aria-label="Edit" />
                  </summary>
                  <div className="space-y-3 pb-4 pt-2">
                    <CityForm city={c} country={country} cur={cur} regions={regions} />
                    <ActionButton action={deleteCity} fields={{ id: c.id }} confirm={`Delete ${c.name}? Carrier mappings for it are removed too.`} className="btn btn-ghost btn-sm text-danger">Delete city</ActionButton>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} pages={pages} base="/admin/settings" params={{ tab: "cities", country, q }} />
      </Panel>
    </div>
  );
}
