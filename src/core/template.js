import { readFileSync } from 'node:fs';

const TEMPLATES_DIR = new URL('../../templates/', import.meta.url);

function lookup(vars, key) {
  if (!(key in vars)) {
    throw new Error(`Variable de plantilla sin definir: ${key}`);
  }
  return vars[key];
}

/** Bloques {{#if key}}…{{else}}…{{/if}} (sin anidar). Un tag solo en su línea no deja línea en blanco. */
function renderConditionals(text, vars) {
  return text
    .replace(/^[ \t]*(\{\{(?:#if \w+|else|\/if)\}\})[ \t]*\r?\n/gm, '$1')
    .replace(/\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, key, yes, no = '') =>
      lookup(vars, key) ? yes : no,
    );
}

export function render(text, vars) {
  return renderConditionals(text, vars).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(lookup(vars, key)));
}

export function renderTemplate(relativePath, vars) {
  const text = readFileSync(new URL(relativePath, TEMPLATES_DIR), 'utf8');
  return render(text, vars);
}
