/** Tiny per-isolate cache for reads that are identical for every visitor (category nav, page links). Writers call clearMemo(). */
const store = new Map<string, { at: number; value: unknown }>();

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  store.set(key, { at: Date.now(), value });
  return value;
}

export const clearMemo = () => store.clear();
