import "server-only";
import { revalidatePath } from "next/cache";
import type { ZodError, ZodType } from "zod";
import { clearMemo } from "@/lib/mem-cache";
import type { ActionState } from "@/features/admin/run";

/** Refresh the storefront and the admin after a change. */
export const refresh = () => { clearMemo(); revalidatePath("/", "layout"); };

export function firstError(e: ZodError): string {
  const i = e.issues[0];
  if (!i) return "Invalid input";
  const where = i.path.length ? `${String(i.path[i.path.length - 1])}: ` : "";
  return `${where}${i.message}`;
}

export function parse<T>(schema: ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; state: ActionState } {
  const r = schema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, state: { error: firstError(r.error), ts: Date.now() } };
}

export const fail = (error: string): ActionState => ({ error, ts: Date.now() });

/** Parse a JSON payload hidden input. */
export function jsonField(form: FormData, key: string): unknown {
  const v = form.get(key);
  if (typeof v !== "string") return undefined;
  try { return JSON.parse(v); } catch { return undefined; }
}

/** Optional integer from a form field: "" -> null. */
export function intOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

export function pageNum(v: string | string[] | undefined): number {
  const n = parseInt(Array.isArray(v) ? v[0] ?? "1" : v ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : 1;
}
export const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] ?? "" : v ?? "");
export const nowMs = (): number => Date.now();
