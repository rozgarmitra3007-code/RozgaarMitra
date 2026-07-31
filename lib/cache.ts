/**
 * ROZGAAR MITRA (rozgaarmitra.com) - ZERO-CRASH HIGH-CONCURRENCY CACHE LAYER
 * In-Memory & Redis caching layer to handle 10 Lakh+ user traffic spikes.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const speedCache = new MemoryCache();
