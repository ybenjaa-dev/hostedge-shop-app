"use client";
import { DataTable } from "@/features/settings/components/table";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { bulkRegionAction, saveCitiesAction } from "../actions";

export type CityView = { id: string; name: string; region: string | null; fee: string; freeAbove: string; codAvailable: boolean; defaultCarrier: string | null };
type CarrierOpt = { id: string; name: string };

export function CitiesEditor({ country, currency, cities, carriers }: { country: string; currency: string; cities: CityView[]; carriers: CarrierOpt[] }) {
  const regions = [...new Set(cities.map((c) => c.region).filter((r): r is string => !!r))].sort();
  return (
    <div className="space-y-6">
      {regions.length > 0 && (
        <AdminForm action={bulkRegionAction} submitLabel="Apply to region" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input type="hidden" name="country" value={country} />
          <Field label="Region"><select name="region" className="field" required defaultValue=""><option value="" disabled>Choose…</option>{regions.map((r) => <option key={r}>{r}</option>)}</select></Field>
          <Field label={`Fee (${currency})`}><input name="fee" inputMode="decimal" className="field num" placeholder="keep" /></Field>
          <Field label={`Free above (${currency})`}><input name="free" inputMode="decimal" className="field num" placeholder="keep" /></Field>
          <Field label="COD"><select name="cod" className="field" defaultValue=""><option value="">keep</option><option value="1">Available</option><option value="0">Not available</option></select></Field>
          <Field label="Default carrier"><select name="dc" className="field" defaultValue=""><option value="">keep</option><option value="none">None</option>{carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </AdminForm>
      )}

      <AdminForm action={saveCitiesAction} submitLabel="Save cities">
        <input type="hidden" name="ids" value={cities.map((c) => c.id).join(",")} />
        <p className="text-xs text-muted">Empty fee = store default fee; empty free-above = store threshold. Amounts in {currency}.</p>
        <DataTable minWidth="44rem" head={["City", "Fee", "Free above", "COD", "Default carrier"]}>
          {cities.map((c) => (
            <tr key={c.id}>
              <td className="font-semibold">{c.name}{c.region && <span className="block text-xs font-normal text-muted">{c.region}</span>}</td>
              <td><input aria-label={`Fee ${c.name}`} name={`fee:${c.id}`} defaultValue={c.fee} inputMode="decimal" className="field num !min-h-10 !py-1.5" /></td>
              <td><input aria-label={`Free above ${c.name}`} name={`free:${c.id}`} defaultValue={c.freeAbove} inputMode="decimal" className="field num !min-h-10 !py-1.5" /></td>
              <td><select aria-label={`COD ${c.name}`} name={`cod:${c.id}`} defaultValue={c.codAvailable ? "1" : "0"} className="field !min-h-10 !py-1.5"><option value="1">Yes</option><option value="0">No</option></select></td>
              <td><select aria-label={`Default carrier ${c.name}`} name={`dc:${c.id}`} defaultValue={c.defaultCarrier ?? ""} className="field !min-h-10 !py-1.5"><option value="">None</option>{carriers.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></td>
            </tr>
          ))}
        </DataTable>
      </AdminForm>
    </div>
  );
}
