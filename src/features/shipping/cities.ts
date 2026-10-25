import "server-only";
import { getEnv } from "@/lib/env";

export type CityRow = { id: string; country: string; name: string; nameAr: string | null; region: string | null; fee: number | null; freeAbove: number | null; codAvailable: boolean; defaultCarrier: string | null; active: boolean };
export type CarrierCityRow = { cityId: string; carrierCityId: string; fee: number | null };

export async function listCityRows(country?: string): Promise<CityRow[]> {
  const q = country
    ? getEnv().DB.prepare("SELECT id, country, name, name_ar AS nameAr, region, fee, free_above AS freeAbove, cod_available AS cod, default_carrier AS defaultCarrier, active FROM cities WHERE country = ? ORDER BY position, name").bind(country)
    : getEnv().DB.prepare("SELECT id, country, name, name_ar AS nameAr, region, fee, free_above AS freeAbove, cod_available AS cod, default_carrier AS defaultCarrier, active FROM cities ORDER BY country, position, name");
  const r = await q.all<Omit<CityRow, "codAvailable" | "active"> & { cod: number; active: number }>();
  return r.results.map(({ cod, active, ...c }) => ({ ...c, codAvailable: !!cod, active: !!active }));
}

export async function listCountries(): Promise<string[]> {
  const r = await getEnv().DB.prepare("SELECT DISTINCT country FROM cities ORDER BY country").all<{ country: string }>();
  return r.results.map((x) => x.country);
}

export async function listCarrierCities(carrierId: string): Promise<CarrierCityRow[]> {
  const r = await getEnv().DB.prepare("SELECT city_id AS cityId, carrier_city_id AS carrierCityId, fee FROM carrier_cities WHERE carrier_id = ?").bind(carrierId).all<CarrierCityRow>();
  return r.results;
}

export const normName = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9؀-ۿ]+/g, " ").trim();

/** Match carrier cities to store cities by normalised name. Pure; returns [cityId, carrierCityId] pairs. */
export function matchCities(stores: { id: string; name: string; nameAr?: string | null }[], carrier: { id: string; name: string }[]): [string, string][] {
  const idx = new Map<string, string>();
  for (const c of carrier) idx.set(normName(c.name), c.id);
  const out: [string, string][] = [];
  for (const s of stores) {
    const hit = idx.get(normName(s.name)) ?? (s.nameAr ? idx.get(normName(s.nameAr)) : undefined);
    if (hit) out.push([s.id, hit]);
  }
  return out;
}

export async function upsertCarrierCities(carrierId: string, rows: { cityId: string; carrierCityId: string; fee?: number | null }[], opts: { replaceAll?: boolean } = {}) {
  const db = getEnv().DB;
  const stmts = [];
  if (opts.replaceAll) stmts.push(db.prepare("DELETE FROM carrier_cities WHERE carrier_id = ?").bind(carrierId));
  for (const r of rows) {
    stmts.push(
      db.prepare("INSERT INTO carrier_cities (carrier_id, city_id, carrier_city_id, fee) VALUES (?1,?2,?3,?4) ON CONFLICT(carrier_id, city_id) DO UPDATE SET carrier_city_id = ?3, fee = ?4").bind(carrierId, r.cityId, r.carrierCityId, r.fee ?? null),
    );
  }
  for (let i = 0; i < stmts.length; i += 90) await db.batch(stmts.slice(i, i + 90));
}

export async function deleteCarrierCity(carrierId: string, cityId: string) {
  await getEnv().DB.prepare("DELETE FROM carrier_cities WHERE carrier_id = ? AND city_id = ?").bind(carrierId, cityId).run();
}
