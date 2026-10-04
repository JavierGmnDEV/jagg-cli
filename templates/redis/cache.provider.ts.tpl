import type { {{cacheContract}} } from '{{contractImport}}';
import { {{cacheImpl}} } from '{{implImport}}';

let cache: {{cacheContract}} | null = null;

export function getCache(): {{cacheContract}} {
  cache ??= new {{cacheImpl}}();
  return cache;
}
