import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { readJson } from './fs.js';

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['package-lock.json', 'npm'],
];

export function detectPackageManager(cwd, preferred) {
  if (preferred) return preferred;
  return LOCKFILES.find(([file]) => existsSync(join(cwd, file)))?.[1] ?? 'npm';
}

export const packageName = (spec) => spec.replace(/(?<=.)@.*$/, '');

function installedNames(pkg) {
  return new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));
}

function runAll(cwd, commands, dryRun) {
  const done = [];
  for (const [bin, ...args] of commands) {
    if (!dryRun) {
      const result = spawnSync(bin, args, { cwd, stdio: 'inherit' });
      if (result.status !== 0) return { done, error: `Falló: ${bin} ${args.join(' ')}` };
    }
    done.push([bin, ...args]);
  }
  return { done };
}

export function installPackages(cwd, { dependencies = [], devDependencies = [] }, { pm, dryRun }) {
  const pkg = readJson(join(cwd, 'package.json'));
  if (!pkg) return { commands: [], installed: [], error: 'No hay package.json en el directorio actual' };

  const installed = installedNames(pkg);
  const groups = [
    [dependencies.filter((s) => !installed.has(packageName(s))), []],
    [devDependencies.filter((s) => !installed.has(packageName(s))), ['-D']],
  ].filter(([specs]) => specs.length > 0);

  const verb = pm === 'npm' ? 'install' : 'add';
  const commands = groups.map(([specs, flags]) => [pm, verb, ...flags, ...specs]);
  const { done, error } = runAll(cwd, commands, dryRun);

  const names = groups.slice(0, done.length).flatMap(([specs]) => specs.map(packageName));
  return { commands: done, installed: names, error };
}

export function uninstallPackages(cwd, names, { pm = 'npm', dryRun }) {
  const pkg = readJson(join(cwd, 'package.json'));
  if (!pkg) return { commands: [], error: 'No hay package.json en el directorio actual' };

  const installed = installedNames(pkg);
  const toRemove = names.filter((name) => installed.has(name));
  if (toRemove.length === 0) return { commands: [] };

  const verb = pm === 'npm' ? 'uninstall' : 'remove';
  const { done, error } = runAll(cwd, [[pm, verb, ...toRemove]], dryRun);
  return { commands: done, error };
}
