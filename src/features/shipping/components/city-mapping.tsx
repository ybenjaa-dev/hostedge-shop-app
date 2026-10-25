"use client";
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
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="bg-sunken text-xs uppercase tracking-wider text-muted"><tr><th className="p-2 text-start">Store city</th><th className="p-2 text-start">{carrierName} city ID</th><th className="p-2 text-start">Fee override ({currency})</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="p-2 font-semibold">{r.name}</td>
                  <td className="p-2"><input aria-label={`${r.name} carrier city ID`} name={`cc:${r.id}`} defaultValue={r.carrierCityId} className="field num !min-h-10 !py-1.5" /></td>
                  <td className="p-2"><input aria-label={`${r.name} fee override`} name={`ccfee:${r.id}`} defaultValue={r.fee} inputMode="decimal" className="field num !min-h-10 !py-1.5" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminForm>
    </div>
  );
}
