export class MemoryCache {
  private cache: Map<string, { value: any; expires: number }>;
  
  constructor() {
    this.cache = new Map();
  }

  set(key: string, value: any, ttlSeconds: number = 3600): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Alias for delete to maintain compatibility
  del(key: string): void {
    this.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get all valid entries (not expired)
  entries(): Array<[string, any]> {
    const now = Date.now();
    return Array.from(this.cache.entries())
      .filter(([_, item]) => item.expires > now)
      .map(([key, item]) => [key, item.value]);
  }
}

export const memoryCache = new MemoryCache();