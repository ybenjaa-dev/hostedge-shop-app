import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { toMajorString } from "@/lib/money";
import { PageHeader, Panel, Empty } from "@/features/admin/components/ui";
import { ADAPTERS } from "@/features/shipping/registry";
import { getPublicCredentialState } from "@/features/shipping/credentials";
import { listCarriers } from "@/features/shipping/service";
import { listCarrierCities, listCityRows, listCountries } from "@/features/shipping/cities";
import { CarrierCard } from "@/features/shipping/components/carrier-card";
import { CitiesEditor } from "@/features/shipping/components/cities-editor";
import { CityMapping } from "@/features/shipping/components/city-mapping";

export const metadata = { title: "Shipping" };

export default async function ShippingPage({ searchParams }: { searchParams: Promise<{ country?: string; carrier?: string }> }) {
  const user = await requirePerm("shipping.manage");
  const owner = user.role === "owner";
  const sp = await searchParams;
  const s = await getSettings();
  const currency = s.store.currency;

  const [carriers, countries] = await Promise.all([listCarriers(), listCountries()]);
  const country = sp.country && countries.includes(sp.country) ? sp.country : countries[0] ?? "";
  const cards = await Promise.all(
    carriers.map(async (c) => {
      const a = ADAPTERS.find((x) => x.id === c.id)!;
      const st = await getPublicCredentialState(c.id); // masked: never contains secret values
      return { ...c, countries: a.countries, docsUrl: a.docsUrl, csvVerified: a.csv.verified, fields: st.fields };
    }),
  );
  const enabled = carriers.filter((c) => c.enabled);
  const mapCarrier = enabled.find((c) => c.id === sp.carrier) ?? enabled[0];
  const cityRows = owner && country ? await listCityRows(country) : [];
  const mapped = owner && mapCarrier ? new Map((await listCarrierCities(mapCarrier.id)).map((m) => [m.cityId, m])) : new Map();
  const q = (o: Record<string, string>) => `/admin/shipping?${new URLSearchParams({ country, ...(mapCarrier ? { carrier: mapCarrier.id } : {}), ...o })}`;

  return (
    <>
      <PageHeader title="Shipping" sub="Carriers, city mapping, fees and COD availability." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => <CarrierCard key={c.id} {...c} owner={owner} />)}
      </div>

      {owner ? (
        <div className="mt-8 space-y-6">
          {countries.length > 1 && (
            <nav aria-label="Country" className="flex flex-wrap gap-2">
              {countries.map((c) => <Link key={c} href={q({ country: c })} className={`btn btn-sm ${c === country ? "btn-primary" : "btn-outline"}`}>{c}</Link>)}
            </nav>
          )}
          <Panel title={`Cities: fees and COD (${country})`}>
            {cityRows.length ? (
              <CitiesEditor
                country={country}
                currency={currency}
                carriers={enabled.map((c) => ({ id: c.id, name: c.name }))}
                cities={cityRows.map((c) => ({ id: c.id, name: c.name, region: c.region, fee: c.fee == null ? "" : toMajorString(c.fee, currency), freeAbove: c.freeAbove == null ? "" : toMajorString(c.freeAbove, currency), codAvailable: c.codAvailable, defaultCarrier: c.defaultCarrier }))}
              />
            ) : <Empty title="No cities for this country yet" />}
          </Panel>
          <Panel title="Carrier city mapping">
            {mapCarrier ? (
              <div className="space-y-4">
                <nav aria-label="Carrier" className="flex flex-wrap gap-2">
                  {enabled.map((c) => <Link key={c.id} href={q({ carrier: c.id })} className={`btn btn-sm ${c.id === mapCarrier.id ? "btn-primary" : "btn-outline"}`}>{c.name}</Link>)}
                </nav>
                <CityMapping
                  key={`${mapCarrier.id}-${country}`}
                  carrierId={mapCarrier.id}
                  carrierName={mapCarrier.name}
                  country={country}
                  currency={currency}
                  canImport={!!ADAPTERS.find((a) => a.id === mapCarrier.id)?.listCities}
                  rows={cityRows.map((c) => ({ id: c.id, name: c.name, carrierCityId: mapped.get(c.id)?.carrierCityId ?? "", fee: mapped.get(c.id)?.fee == null ? "" : toMajorString(mapped.get(c.id)!.fee!, currency) }))}
                />
              </div>
            ) : <Empty title="Enable a carrier first" hint="Mapping is available for enabled carriers." />}
          </Panel>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">City fees and carrier mapping are managed by the owner.</p>
      )}
    </>
  );
}
