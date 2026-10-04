import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function readPackage(cwd) {
  const file = join(cwd, 'package.json');
  const text = readFileSync(file, 'utf8');
  const indent = text.match(/^[ \t]+(?=")/m)?.[0] ?? 2;
  return { file, pkg: JSON.parse(text), indent };
}

const savePackage = ({ file, pkg, indent }) => writeFileSync(file, `${JSON.stringify(pkg, null, indent)}\n`);

/**
 * Se edita package.json en el lugar en vez de pasar por el tracker: npm también
 * lo modifica al instalar, así que restaurar el archivo entero pisaría esos cambios.
 */
export function addScripts(cwd, scripts, { dryRun }) {
  const data = readPackage(cwd);
  const current = data.pkg.scripts ?? {};
  const added = Object.fromEntries(Object.entries(scripts).filter(([name]) => !(name in current)));
  if (Object.keys(added).length > 0 && !dryRun) {
    data.pkg.scripts = { ...current, ...added };
    savePackage(data);
  }
  return added;
}

/** Quita solo los scripts que siguen teniendo el valor que agregó jg. */
export function removeScripts(cwd, scripts, { dryRun }) {
  const data = readPackage(cwd);
  const current = data.pkg.scripts ?? {};
  const removable = Object.keys(scripts).filter((name) => current[name] === scripts[name]);
  if (removable.length > 0 && !dryRun) {
    for (const name of removable) delete current[name];
    savePackage(data);
  }
  return removable;
}
