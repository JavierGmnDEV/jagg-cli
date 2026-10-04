import { readFileSync } from 'node:fs';

const TEMPLATES_DIR = new URL('../../templates/', import.meta.url);

export function render(text, vars) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    if (!(key in vars)) {
      throw new Error(`Variable de plantilla sin definir: ${key}`);
    }
    return String(vars[key]);
  });
}

export function renderTemplate(relativePath, vars) {
  const text = readFileSync(new URL(relativePath, TEMPLATES_DIR), 'utf8');
  return render(text, vars);
}
