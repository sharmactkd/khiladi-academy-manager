const entries = new Map();

const now = () => Date.now();

export const cachedRequest = (key, loader, ttlMs = 30_000) => {
  const existing = entries.get(key);
  if (existing && existing.expiresAt > now()) return existing.promise;

  const promise = Promise.resolve()
    .then(loader)
    .catch((error) => {
      entries.delete(key);
      throw error;
    });

  entries.set(key, { promise, expiresAt: now() + ttlMs });
  return promise;
};

export const invalidateRequestCache = (prefix = "") => {
  for (const key of entries.keys()) {
    if (!prefix || key.startsWith(prefix)) entries.delete(key);
  }
};

export const clearRequestCache = () => entries.clear();
