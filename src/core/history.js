import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJson } from './fs.js';

const DIR = '.jg';
const FILE = 'history.json';

export function readHistory(cwd) {
  return readJson(join(cwd, DIR, FILE)) ?? [];
}

export function writeHistory(cwd, entries) {
  const dir = join(cwd, DIR);
  if (entries.length === 0) {
    rmSync(dir, { recursive: true, force: true });
    return;
  }
  mkdirSync(dir, { recursive: true });
  // El historial guarda contenidos previos (incluido .env): nunca debe commitearse
  if (!existsSync(join(dir, '.gitignore'))) writeFileSync(join(dir, '.gitignore'), '*\n');
  writeFileSync(join(dir, FILE), `${JSON.stringify(entries, null, 2)}\n`);
}

export function pushHistory(cwd, entry) {
  writeHistory(cwd, [...readHistory(cwd), entry]);
}
