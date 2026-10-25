"use server";
import { z } from "zod";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { run, audit, fd, type ActionState } from "@/features/admin/run";
import { getSettings } from "@/lib/settings";
import { toMinor } from "@/lib/money";
import { countryByCode } from "@/lib/phone";
import { newId } from "@/lib/id";
import { parse, refresh, fail } from "../lib";

async function feeOrNull(raw: string): Promise<number | null> {
  if (raw.trim() === "") return null;
  const n = toMinor(raw, (await getSettings()).store.currency);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) throw new RangeError("bad fee");
  return n;
}

export async function saveCity(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const p = parse(
      z.object({
        id: z.string().max(40),
        country: z.string().refine((c) => !!countryByCode(c), "Choose a country"),
        name: z.string().min(1, "City name is required").max(80),
        nameAr: z.string().max(80),
        region: z.string().max(80),
      }),
      { id: fd(form, "id"), country: fd(form, "country"), name: fd(form, "name"), nameAr: fd(form, "nameAr"), region: fd(form, "region") },
    );
    if (!p.ok) return p.state;
    let fee: number | null, freeAbove: number | null;
    try { fee = await feeOrNull(fd(form, "fee")); freeAbove = await feeOrNull(fd(form, "freeAbove")); } catch { return fail("Fee amounts must be valid numbers"); }
    const d = p.data;
    const values = { country: d.country, name: d.name, nameAr: d.nameAr || null, region: d.region || null, fee, freeAbove, codAvailable: form.get("codAvailable") === "1", active: form.get("active") === "1" };
    const db = getDb();
    if (d.id) {
      await db.update(schema.cities).set(values).where(eq(schema.cities.id, d.id));
      await audit(user, "city.update", "city", d.id);
    } else {
      const id = newId();
      const max = await db.select({ m: sql<number>`coalesce(max(${schema.cities.position}), -1)` }).from(schema.cities).where(eq(schema.cities.country, d.country)).get();
      await db.insert(schema.cities).values({ id, ...values, position: (max?.m ?? -1) + 1 });
      await audit(user, "city.create", "city", id);
    }
    refresh();
    return { message: d.id ? "City updated" : "City added" };
  });
}

export async function deleteCity(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const id = fd(form, "id");
    if (!id) return fail("Missing city");
    const db = getDb();
    await db.delete(schema.carrierCities).where(eq(schema.carrierCities.cityId, id));
    await db.delete(schema.cities).where(eq(schema.cities.id, id));
    await audit(user, "city.delete", "city", id);
    refresh();
    return { message: "City deleted" };
  });
}

/** Set the shipping fee for every city in a region (or the whole country). */
export async function bulkCityFee(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (user) => {
    const country = fd(form, "country");
    const region = fd(form, "region");
    if (!countryByCode(country)) return fail("Choose a country");
    let fee: number | null;
    try { fee = await feeOrNull(fd(form, "fee")); } catch { return fail("Fee must be a valid amount"); }
    const where = region === "__all" ? eq(schema.cities.country, country)
      : region === "__none" ? and(eq(schema.cities.country, country), isNull(schema.cities.region))
      : and(eq(schema.cities.country, country), eq(schema.cities.region, region));
    const rows = await getDb().select({ id: schema.cities.id }).from(schema.cities).where(where);
    for (let i = 0; i < rows.length; i += 80) await getDb().update(schema.cities).set({ fee }).where(inArray(schema.cities.id, rows.slice(i, i + 80).map((r) => r.id)));
    await audit(user, "city.bulk_fee", "city", country, { region, fee, count: rows.length });
    refresh();
    return { message: `Fee updated for ${rows.length} cities` };
  });
}
