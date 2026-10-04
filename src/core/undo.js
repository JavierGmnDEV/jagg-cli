import { existsSync, readFileSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readHistory, writeHistory } from './history.js';
import { log } from './logger.js';
import { uninstallPackages } from './packages.js';
import { removeScripts } from './scripts.js';

const currentContent = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : null);

function revertEntry(cwd, entry, { force, dryRun }) {
  const conflicts = entry.files.filter((f) => currentContent(join(cwd, f.path)) !== f.after);
  if (conflicts.length > 0 && !force) {
    for (const f of conflicts) log.status('modified', f.path);
    log.warn('Estos archivos cambiaron después de generarse. Usa --force para revertirlos igual.');
    return false;
  }

  for (const f of entry.files) {
    const abs = join(cwd, f.path);
    if (f.before === null) {
      if (!dryRun && existsSync(abs)) unlinkSync(abs);
      log.status('deleted', f.path);
    } else {
      if (!dryRun) writeFileSync(abs, f.before);
      log.status('restored', f.path);
    }
  }

  if (!dryRun) {
    for (const dir of [...entry.dirs].sort((a, b) => b.length - a.length)) {
      try {
        rmdirSync(join(cwd, dir));
        log.status('deleted', `${dir}/`);
      } catch {
        // la carpeta no está vacía: tiene archivos que no generó jg
      }
    }
  }

  if (entry.scripts && Object.keys(entry.scripts).length > 0) {
    for (const name of removeScripts(cwd, entry.scripts, { dryRun })) {
      log.status('deleted', `package.json → scripts.${name}`);
    }
  }

  if (entry.packages?.length) {
    const { commands = [], error } = uninstallPackages(cwd, entry.packages, { pm: entry.pm, dryRun });
    for (const cmd of commands) log.status(dryRun ? 'skipped' : 'updated', cmd.join(' '));
    if (error) log.warn(error);
  }
  return true;
}

export function undo(cwd, { steps = 1, force = false, dryRun = false } = {}) {
  if (!Number.isInteger(steps) || steps < 1) throw new Error('La cantidad de pasos debe ser un entero positivo');

  const history = readHistory(cwd);
  if (history.length === 0) {
    log.warn('No hay cambios para deshacer');
    return;
  }

  for (const entry of history.slice(-steps).reverse()) {
    log.title(`jg undo → ${entry.command}${dryRun ? ' (dry-run)' : ''}`);
    if (!revertEntry(cwd, entry, { force, dryRun })) break;
    if (!dryRun) {
      history.pop();
      writeHistory(cwd, history);
    }
  }
  log.success('Listo');
}

export function printHistory(cwd) {
  const history = readHistory(cwd);
  if (history.length === 0) {
    log.info('Sin historial');
    return;
  }
  history
    .slice()
    .reverse()
    .forEach((entry, i) => {
      const date = new Date(entry.date).toLocaleString();
      const pkgs = entry.packages?.length ? `, paquetes: ${entry.packages.join(' ')}` : '';
      log.info(`${String(i + 1).padStart(3)}  ${date}  jg ${entry.command}  (${entry.files.length} archivos${pkgs})`);
    });
}
