import "server-only";
import { getEnv } from "@/lib/env";
import { getInstallSecret } from "@/features/orders/service";
import { decryptCredentials, encryptCredentials, isConfigured, mergeCredentials, publicFields, type PublicField } from "./credentials-core";
import { getAdapter } from "./registry";
import type { Credentials } from "./types";

type Row = { enabled: number; credentials: string | null; config: string };

async function row(carrierId: string): Promise<Row | null> {
  return getEnv().DB.prepare("SELECT enabled, credentials, config FROM carriers WHERE id = ?").bind(carrierId).first<Row>();
}

/** Server-only: decrypted credentials. Never pass the result to a client component. */
export async function loadCredentials(carrierId: string): Promise<Credentials> {
  const r = await row(carrierId);
  return decryptCredentials(r?.credentials, await getInstallSecret());
}

export async function loadConfig(carrierId: string): Promise<Record<string, unknown>> {
  const r = await row(carrierId);
  try { return JSON.parse(r?.config ?? "{}") as Record<string, unknown>; } catch { return {}; }
}

/** Save (merge) credentials. Blank submitted values keep the stored ones. */
export async function saveCredentials(carrierId: string, submitted: Record<string, string>): Promise<void> {
  const adapter = getAdapter(carrierId);
  if (!adapter) throw new Error("Unknown carrier");
  const existing = await loadCredentials(carrierId);
  const merged = mergeCredentials(adapter.credentialFields, existing, submitted);
  const blob = await encryptCredentials(merged, await getInstallSecret());
  await getEnv().DB.prepare(
    `INSERT INTO carriers (id, enabled, credentials, config, updated_at) VALUES (?1, 0, ?2, '{}', ?3)
     ON CONFLICT(id) DO UPDATE SET credentials = ?2, updated_at = ?3`,
  ).bind(carrierId, blob, Date.now()).run();
}

/** Client-safe view: configured flag + masked hints; secret values are never included. */
export async function getPublicCredentialState(carrierId: string): Promise<{ configured: boolean; fields: PublicField[] }> {
  const adapter = getAdapter(carrierId);
  if (!adapter) return { configured: false, fields: [] };
  const creds = await loadCredentials(carrierId);
  return { configured: adapter.hasApi ? isConfigured(adapter.credentialFields, creds) : true, fields: publicFields(adapter.credentialFields, creds) };
}
