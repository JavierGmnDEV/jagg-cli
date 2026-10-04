import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function existingKeys(content) {
  return new Set([...content.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map((m) => m[1]));
}

function appendVars(file, section, vars, write) {
  const content = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const keys = existingKeys(content);
  const missing = Object.entries(vars).filter(([key]) => !keys.has(key));
  if (missing.length === 0) return 'skipped';

  const block = [`# ${section}`, ...missing.map(([k, v]) => `${k}=${v}`)].join('\n');
  const separator = content === '' ? '' : content.endsWith('\n') ? '\n' : '\n\n';
  write(file, `${content}${separator}${block}\n`);
  return content === '' ? 'created' : 'updated';
}

/** Siempre actualiza .env.example; .env solo si ya existe. */
export function addEnvVars(cwd, section, vars, write) {
  const results = [['.env.example', appendVars(join(cwd, '.env.example'), section, vars, write)]];
  const envFile = join(cwd, '.env');
  if (existsSync(envFile)) results.push(['.env', appendVars(envFile, section, vars, write)]);
  return results;
}
