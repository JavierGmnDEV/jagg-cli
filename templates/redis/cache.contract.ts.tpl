export interface {{cacheContract}} {
  get<T = string>(key: string): Promise<T | null>;
  set<T = string>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}
