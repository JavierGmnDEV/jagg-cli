import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export function writeFile(target, content, { force = false, dryRun = false } = {}) {
  const exists = existsSync(target);
  if (exists && !force) return 'skipped';
  if (!dryRun) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return exists ? 'overwritten' : 'created';
}

export function readJson(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8'));
}
