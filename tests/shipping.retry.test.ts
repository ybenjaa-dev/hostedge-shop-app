import { describe, expect, it, vi } from "vitest";
import { fetchWithRetry, retryAsync } from "@/features/shipping/http";
import { CarrierHttpError } from "@/features/shipping/types";

const sleep = vi.fn(async () => {});
const res = (status: number) => new Response("x", { status });

describe("fetchWithRetry", () => {
  it("retries 5xx with exponential backoff then succeeds", async () => {
    sleep.mockClear();
    const f = vi.fn().mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(502)).mockResolvedValueOnce(res(200));
    const r = await fetchWithRetry("https://x.test", {}, { fetchImpl: f, sleep, baseMs: 100 });
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((c: unknown[]) => c[0])).toEqual([100, 200]);
  });
  it("retries network errors / timeouts, then throws a retryable error", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchWithRetry("https://x.test", {}, { fetchImpl: f, sleep, retries: 2 })).rejects.toMatchObject({ retryable: true });
    expect(f).toHaveBeenCalledTimes(3);
  });
  it("does not retry 4xx", async () => {
    const f = vi.fn().mockResolvedValue(res(422));
    expect((await fetchWithRetry("https://x.test", {}, { fetchImpl: f, sleep })).status).toBe(422);
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("gives up after retries on persistent 5xx", async () => {
    const f = vi.fn().mockImplementation(async () => res(500));
    await expect(fetchWithRetry("https://x.test", {}, { fetchImpl: f, sleep, retries: 1 })).rejects.toBeInstanceOf(CarrierHttpError);
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("retryAsync", () => {
  it("retries only retryable carrier errors", async () => {
    const ok = vi.fn().mockRejectedValueOnce(new CarrierHttpError("x", 503, true)).mockResolvedValueOnce("done");
    expect(await retryAsync(ok, { sleep })).toBe("done");
    const bad = vi.fn().mockRejectedValue(new CarrierHttpError("invalid", 422, false));
    await expect(retryAsync(bad, { sleep })).rejects.toThrow("invalid");
    expect(bad).toHaveBeenCalledTimes(1);
    const plain = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(retryAsync(plain, { sleep })).rejects.toThrow("boom");
    expect(plain).toHaveBeenCalledTimes(1);
  });
});
