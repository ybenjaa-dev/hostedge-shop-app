"use server";
import { revalidatePath } from "next/cache";
import { audit, fd, run, type ActionState } from "@/features/admin/run";
import { getEnv } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { toMinor } from "@/lib/money";
import { getAdapter } from "./registry";
import { loadCredentials, saveCredentials } from "./credentials";
import { deleteCarrierCity, listCityRows, matchCities, normName, upsertCarrierCities } from "./cities";
import { sendOrdersToCarrier, setManualTracking, type SendResult } from "./service";

const PATH = "/admin/shipping";
const bad = (error: string): ActionState => ({ ok: false, error });

function money(raw: string, currency: string): number | null | "bad" {
  if (!raw) return null;
  const n = toMinor(raw, currency);
  return Number.isNaN(n) || n < 0 || n > 1_000_000_000 ? "bad" : n;
}

// ------------------------------------------------------------------ owner: carriers

export async function toggleCarrierAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (u) => {
    const id = fd(form, "carrierId");
    if (!getAdapter(id)) return bad("Unknown carrier");
    const enabled = fd(form, "enabled") === "1";
    await getEnv().DB.prepare("INSERT INTO carriers (id, enabled, config, updated_at) VALUES (?1, ?2, '{}', ?3) ON CONFLICT(id) DO UPDATE SET enabled = ?2, updated_at = ?3").bind(id, enabled ? 1 : 0, Date.now()).run();
    await audit(u, enabled ? "carrier.enable" : "carrier.disable", "carrier", id);
    revalidatePath(PATH);
    return { message: enabled ? "Carrier enabled" : "Carrier disabled" };
  });
}

export async function saveCredentialsAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (u) => {
    const id = fd(form, "carrierId");
    const adapter = getAdapter(id);
    if (!adapter) return bad("Unknown carrier");
    const submitted: Record<string, string> = {};
    for (const f of adapter.credentialFields) submitted[f.key] = fd(form, `cred.${f.key}`);
    await saveCredentials(id, submitted);
    await audit(u, "carrier.credentials", "carrier", id); // never log values
    revalidatePath(PATH);
    return { message: "Credentials saved" };
  });
}

export async function testConnectionAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async () => {
    const id = fd(form, "carrierId");
    const adapter = getAdapter(id);
    if (!adapter) return bad("Unknown carrier");
    const creds = await loadCredentials(id);
    if (adapter.hasApi && adapter.credentialFields.some((f) => !creds[f.key])) return bad("Save the credentials first.");
    try {
      const r = await adapter.testConnection(creds);
      return r.ok ? { message: r.message || "Connection OK" } : bad(r.message || "Connection failed");
    } catch (e) {
      return bad(`Connection failed: ${e instanceof Error ? e.message.slice(0, 200) : "unknown error"}`);
    }
  });
}

// ------------------------------------------------------------------ owner: cities

export async function importCarrierCitiesAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async () => {
    const id = fd(form, "carrierId");
    const adapter = getAdapter(id);
    if (!adapter?.listCities) return bad("This carrier cannot list its cities. Use the paste box instead.");
    const list = await adapter.listCities(await loadCredentials(id));
    const country = fd(form, "country");
    const stores = await listCityRows(country || undefined);
    const existing = new Set((await getEnv().DB.prepare("SELECT city_id FROM carrier_cities WHERE carrier_id = ?").bind(id).all<{ city_id: string }>()).results.map((r) => r.city_id));
    const pairs = matchCities(stores.filter((c) => !existing.has(c.id)), list);
    await upsertCarrierCities(id, pairs.map(([cityId, carrierCityId]) => ({ cityId, carrierCityId })));
    revalidatePath(PATH);
    return { message: `${list.length} carrier cities read, ${pairs.length} new matches saved` };
  });
}

export async function saveCarrierCitiesAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (u) => {
    const carrierId = fd(form, "carrierId");
    if (!getAdapter(carrierId)) return bad("Unknown carrier");
    const currency = (await getSettings()).store.currency;
    const cityIds = fd(form, "ids").split(",").filter(Boolean);
    const known = new Set((await listCityRows()).map((c) => c.id));
    const rows: { cityId: string; carrierCityId: string; fee: number | null }[] = [];
    for (const cityId of cityIds) {
      if (!known.has(cityId)) continue;
      const cc = fd(form, `cc:${cityId}`).slice(0, 80);
      if (!cc) { await deleteCarrierCity(carrierId, cityId); continue; }
      const fee = money(fd(form, `ccfee:${cityId}`), currency);
      if (fee === "bad") return bad("Invalid fee amount");
      rows.push({ cityId, carrierCityId: cc, fee });
    }
    // Optional paste: lines "City name, carrierCityId" (also ; or tab)
    const paste = fd(form, "paste");
    if (paste) {
      const stores = await listCityRows(fd(form, "country") || undefined);
      const byName = new Map(stores.flatMap((c) => [[normName(c.name), c.id] as const, ...(c.nameAr ? [[normName(c.nameAr), c.id] as const] : [])]));
      for (const line of paste.split(/\r?\n/)) {
        const m = line.split(/[;\t,]/).map((x) => x.trim());
        if (m.length < 2 || !m[0] || !m[1]) continue;
        const cityId = byName.get(normName(m[0]));
        if (cityId) { const i = rows.findIndex((r) => r.cityId === cityId); if (i >= 0) rows[i]!.carrierCityId = m[1].slice(0, 80); else rows.push({ cityId, carrierCityId: m[1].slice(0, 80), fee: null }); }
      }
    }
    await upsertCarrierCities(carrierId, rows);
    await audit(u, "carrier.cities", "carrier", carrierId, { count: rows.length });
    revalidatePath(PATH);
    return { message: `${rows.length} city mappings saved` };
  });
}

export async function saveCitiesAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (u) => {
    const currency = (await getSettings()).store.currency;
    const ids = fd(form, "ids").split(",").filter(Boolean);
    const known = new Set((await listCityRows()).map((c) => c.id));
    const db = getEnv().DB;
    const stmts = [];
    for (const id of ids) {
      if (!known.has(id)) continue;
      const fee = money(fd(form, `fee:${id}`), currency);
      const free = money(fd(form, `free:${id}`), currency);
      if (fee === "bad" || free === "bad") return bad("Invalid amount");
      const dc = fd(form, `dc:${id}`);
      if (dc && !getAdapter(dc)) return bad("Unknown carrier");
      stmts.push(db.prepare("UPDATE cities SET fee = ?, free_above = ?, cod_available = ?, default_carrier = ? WHERE id = ?").bind(fee, free, fd(form, `cod:${id}`) === "0" ? 0 : 1, dc || null, id));
    }
    for (let i = 0; i < stmts.length; i += 90) await db.batch(stmts.slice(i, i + 90));
    await audit(u, "cities.update", "city", undefined, { count: stmts.length });
    revalidatePath(PATH);
    return { message: `${stmts.length} cities saved` };
  });
}

/** Apply fee / free-above / COD / default carrier to every city of one region. Blank / "keep" leaves a field alone. */
export async function bulkRegionAction(_p: ActionState, form: FormData): Promise<ActionState> {
  return run("owner", async (u) => {
    const currency = (await getSettings()).store.currency;
    const country = fd(form, "country");
    const region = fd(form, "region");
    if (!country || !region) return bad("Pick a region");
    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    const fee = fd(form, "fee"), free = fd(form, "free"), cod = fd(form, "cod"), dc = fd(form, "dc");
    if (fee) { const v = money(fee, currency); if (v === "bad" || v === null) return bad("Invalid fee"); sets.push("fee = ?"); vals.push(v); }
    if (free) { const v = money(free, currency); if (v === "bad" || v === null) return bad("Invalid free-above amount"); sets.push("free_above = ?"); vals.push(v); }
    if (cod === "1" || cod === "0") { sets.push("cod_available = ?"); vals.push(Number(cod)); }
    if (dc) { if (dc !== "none" && !getAdapter(dc)) return bad("Unknown carrier"); sets.push("default_carrier = ?"); vals.push(dc === "none" ? null : dc); }
    if (!sets.length) return bad("Nothing to change");
    const r = await getEnv().DB.prepare(`UPDATE cities SET ${sets.join(", ")} WHERE country = ? AND region = ?`).bind(...vals, country, region).run();
    await audit(u, "cities.bulk", "city", undefined, { country, region, changes: r.meta.changes });
    revalidatePath(PATH);
    return { message: `${r.meta.changes} cities in ${region} updated` };
  });
}

// ------------------------------------------------------------------ staff: sending orders (called from the orders UI)

export type SendActionState = ActionState & { results?: SendResult[] };

/** Staff may send. Returns per-order results; failures are stored on the order as shipment_error. */
export async function sendOrdersAction(orderIds: string[], carrierId: string): Promise<SendActionState> {
  let results: SendResult[] = [];
  const st = await run("staff", async (u) => {
    if (!Array.isArray(orderIds) || !orderIds.length || orderIds.length > 100) return bad("Select 1 to 100 orders");
    results = await sendOrdersToCarrier(orderIds.filter((x) => typeof x === "string"), String(carrierId), { id: u.id, name: u.name });
    const ok = results.filter((r) => r.ok).length;
    await audit(u, "orders.ship", "carrier", carrierId, { ok, failed: results.length - ok });
    revalidatePath("/admin/orders");
    return ok === results.length ? { message: `${ok} sent` } : { ok: ok > 0, error: ok ? undefined : results[0]?.error, message: `${ok} sent, ${results.length - ok} failed` };
  });
  return { ...st, results };
}

export async function setTrackingAction(orderId: string, carrierId: string, trackingNumber: string): Promise<ActionState> {
  return run("staff", async (u) => {
    const r = await setManualTracking(String(orderId), String(carrierId), String(trackingNumber), { id: u.id, name: u.name });
    if (!r.ok) return bad(r.error ?? "Failed");
    await audit(u, "order.tracking", "order", String(orderId), { carrierId });
    revalidatePath("/admin/orders");
    return { message: "Tracking saved" };
  });
}
