import { decryptJson, encryptJson } from "@/lib/crypto";
import type { CredentialField, Credentials } from "./types";

export async function encryptCredentials(values: Credentials, secret: string): Promise<string> {
  return encryptJson(values, secret);
}
export async function decryptCredentials(payload: string | null | undefined, secret: string): Promise<Credentials> {
  if (!payload) return {};
  try { return await decryptJson<Credentials>(payload, secret); } catch { return {}; }
}

/** Merge a submitted form over stored values: blank submitted values keep the stored one. Unknown keys dropped. */
export function mergeCredentials(fields: CredentialField[], existing: Credentials, submitted: Record<string, string>): Credentials {
  const out: Credentials = {};
  for (const f of fields) {
    const v = (submitted[f.key] ?? "").trim();
    const keep = existing[f.key] ?? "";
    if (v) out[f.key] = v; else if (keep) out[f.key] = keep;
  }
  return out;
}

export type PublicField = { key: string; label: string; secret: boolean; hint?: string; configured: boolean; /** non-secret: the value; secret: masked tail only */ display: string };

export function maskSecret(v: string): string {
  return v.length > 6 ? `••••${v.slice(-2)}` : "••••";
}

/** What the client may see. Secret values never leave the server; only a masked tail of 2 chars (if long enough). */
export function publicFields(fields: CredentialField[], creds: Credentials): PublicField[] {
  return fields.map((f) => {
    const v = creds[f.key] ?? "";
    return { key: f.key, label: f.label, secret: f.secret, hint: f.hint, configured: !!v, display: !v ? "" : f.secret ? maskSecret(v) : v };
  });
}

export const isConfigured = (fields: CredentialField[], creds: Credentials) => fields.length > 0 && fields.every((f) => !!creds[f.key]);
