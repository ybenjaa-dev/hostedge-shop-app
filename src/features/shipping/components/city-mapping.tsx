"use client";
import { DataTable } from "@/features/settings/components/table";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { importCarrierCitiesAction, saveCarrierCitiesAction } from "../actions";

export type MapRow = { id: string; name: string; carrierCityId: string; fee: string };

export function CityMapping({ carrierId, carrierName, country, currency, rows, canImport }: { carrierId: string; carrierName: string; country: string; currency: string; rows: MapRow[]; canImport: boolean }) {
  return (
    <div className="space-y-5">
      {canImport && (
        <AdminForm action={importCarrierCitiesAction} submitLabel={`Import cities from ${carrierName}`}>
          <input type="hidden" name="carrierId" value={carrierId} />
          <input type="hidden" name="country" value={country} />
        </AdminForm>
      )}
      <AdminForm action={saveCarrierCitiesAction} submitLabel="Save mapping">
        <input type="hidden" name="carrierId" value={carrierId} />
        <input type="hidden" name="country" value={country} />
        <input type="hidden" name="ids" value={rows.map((r) => r.id).join(",")} />
        <Field label="Paste mapping (optional)" hint="One per line: store city name, carrier city ID. Matched by name (accents ignored). Overrides the fields below.">
          <textarea name="paste" rows={3} className="field num" placeholder={"Casablanca, 1\nRabat, 2"} />
        </Field>
        <DataTable minWidth="30rem" head={["Store city", `${carrierName} city ID`, `Fee override (${currency})`]}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-semibold">{r.name}</td>
              <td><input aria-label={`${r.name} carrier city ID`} name={`cc:${r.id}`} defaultValue={r.carrierCityId} className="field num !min-h-10 !py-1.5" /></td>
              <td><input aria-label={`${r.name} fee override`} name={`ccfee:${r.id}`} defaultValue={r.fee} inputMode="decimal" className="field num !min-h-10 !py-1.5" /></td>
            </tr>
          ))}
        </DataTable>
      </AdminForm>
    </div>
  );
}
