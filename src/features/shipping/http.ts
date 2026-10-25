import { CarrierHttpError } from "./types";

export type RetryOpts = { retries?: number; baseMs?: number; timeoutMs?: number; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void> };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * fetch with timeout + exponential backoff. Retries network errors, timeouts, 429 and 5xx.
 * 4xx (except 429) is returned as-is so callers can read the carrier's validation message.
 * NOTE: only use for idempotent calls or when a duplicate shipment is acceptable to the caller.
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}, opts: RetryOpts = {}): Promise<Response> {
  const { retries = 2, baseMs = 400, timeoutMs = 15_000, fetchImpl = fetch, sleep = defaultSleep } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 500 || res.status === 429) {
        lastErr = new CarrierHttpError(`Carrier responded ${res.status}`, res.status, true);
        if (attempt < retries) { await res.body?.cancel().catch(() => {}); await sleep(baseMs * 2 ** attempt); continue; }
        throw lastErr;
      }
      return res;
    } catch (e) {
      if (e instanceof CarrierHttpError) throw e;
      lastErr = e;
      if (attempt < retries) { await sleep(baseMs * 2 ** attempt); continue; }
    }
  }
  throw new CarrierHttpError(lastErr instanceof Error ? `Network error: ${lastErr.message}` : "Network error", null, true);
}

/** Generic retry for a carrier call: retries CarrierHttpError{retryable} only (5xx/429/timeout/network). */
export async function retryAsync<T>(fn: () => Promise<T>, opts: { retries?: number; baseMs?: number; sleep?: (ms: number) => Promise<void> } = {}): Promise<T> {
  const { retries = 2, baseMs = 500, sleep = defaultSleep } = opts;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      const retryable = e instanceof CarrierHttpError && e.retryable;
      if (!retryable || attempt >= retries) throw e;
      await sleep(baseMs * 2 ** attempt);
    }
  }
}
