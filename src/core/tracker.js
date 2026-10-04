import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative } from 'node:path';

function missingDirs(cwd, dir) {
  const missing = [];
  for (let current = dir; current.startsWith(cwd) && current !== cwd && !existsSync(current); current = dirname(current)) {
    missing.push(relative(cwd, current));
  }
  return missing;
}

/** Escribe archivos guardando su contenido previo para poder deshacer. */
export function createTracker(cwd, { dryRun = false } = {}) {
  const files = new Map();
  const dirs = [];

  return {
    write(absPath, content) {
      const path = relative(cwd, absPath);
      if (!files.has(path)) {
        files.set(path, { before: existsSync(absPath) ? readFileSync(absPath, 'utf8') : null });
      }
      files.get(path).after = content;
      if (dryRun) return;
      dirs.push(...missingDirs(cwd, dirname(absPath)));
      mkdirSync(dirname(absPath), { recursive: true });
      writeFileSync(absPath, content);
    },
    get files() {
      return [...files].map(([path, change]) => ({ path, ...change }));
    },
    get dirs() {
      return dirs;
    },
  };
}
