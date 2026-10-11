import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function existingKeys(content) {
  return new Set([...content.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)].map((m) => m[1]));
}

const emptyLine = (key) => new RegExp(`^(\\s*(?:export\\s+)?${key}\\s*=)[ \\t]*$`, 'm');

function appendVars(file, section, vars, write, example) {
  let content = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const original = content;
  const keys = existingKeys(content);
  const value = (v) => (typeof v === 'object' ? (example ? v.example : v.value) : v);

  // Un secreto vacío (p. ej. .env copiado de .env.example) se rellena: no hay valor del usuario que pisar
  for (const [key, v] of Object.entries(vars)) {
    if (typeof v === 'object' && keys.has(key) && value(v)) {
      content = content.replace(emptyLine(key), `$1${value(v)}`);
    }
  }

  const missing = Object.entries(vars).filter(([key]) => !keys.has(key));
  if (missing.length > 0) {
    const block = [`# ${section}`, ...missing.map(([k, v]) => `${k}=${value(v)}`)].join('\n');
    const separator = content === '' ? '' : content.endsWith('\n') ? '\n' : '\n\n';
    content = `${content}${separator}${block}\n`;
  }

  if (content === original) return 'skipped';
  write(file, content);
  return original === '' ? 'created' : 'updated';
}

/**
 * .env.example (se commitea) y .env (local, ignorado por git): ambos se crean si faltan; nunca se pisan valores existentes.
 * Un valor `{ value, example }` separa el secreto real (.env) del que se commitea (.env.example).
 */
export function addEnvVars(cwd, section, vars, write) {
  return ['.env.example', '.env'].map((file) => [
    file,
    appendVars(join(cwd, file), section, vars, write, file === '.env.example'),
  ]);
}
