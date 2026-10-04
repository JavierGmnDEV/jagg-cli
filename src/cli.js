import { readFileSync } from 'node:fs';
import { Command } from 'commander';
import { generators } from './generators/index.js';
import { runGenerator } from './core/runner.js';
import { initConfig } from './core/config.js';
import { log } from './core/logger.js';
import { printHistory, undo } from './core/undo.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function withCommonOptions(cmd) {
  return cmd
    .option('-d, --dry-run', 'muestra lo que haría sin escribir nada')
    .option('-f, --force', 'sobrescribe archivos y servicios existentes')
    .option('--skip-install', 'no instala dependencias')
    .option('--skip-docker', 'no modifica docker-compose')
    .option('--src <dir>', 'carpeta base del código (por defecto: src)');
}

export async function run(argv) {
  const program = new Command();

  program
    .name('jg')
    .description('Scaffolding con Clean Architecture, adapters y singletons')
    .version(pkg.version);

  program
    .command('init')
    .description('crea jg.config.json en el proyecto actual')
    .option('-f, --force', 'sobrescribe la configuración existente')
    .action((opts) => initConfig(process.cwd(), opts));

  program
    .command('undo [steps]')
    .description('deshace las últimas N generaciones (por defecto 1)')
    .option('-d, --dry-run', 'muestra lo que revertiría sin tocar nada')
    .option('-f, --force', 'revierte aunque los archivos hayan cambiado después de generarse')
    .action((steps, opts) => undo(process.cwd(), { ...opts, steps: Number(steps ?? 1) }));

  program
    .command('history')
    .description('lista las generaciones que se pueden deshacer (la 1 es la más reciente)')
    .action(() => printHistory(process.cwd()));

  program
    .command('list')
    .description('lista los generadores disponibles')
    .action(() => {
      for (const gen of generators) {
        log.info(`${gen.usage.padEnd(22)} ${gen.description}`);
      }
    });

  const generate = program
    .command('generate')
    .alias('g')
    .description('genera archivos a partir de un generador');

  for (const gen of generators) {
    const cmd = withCommonOptions(generate.command(gen.usage).description(gen.description));
    for (const [flags, description] of gen.options ?? []) cmd.option(flags, description);
    cmd.action(async (...args) => {
      const name = gen.requiresName ? args[0] : undefined;
      await runGenerator(gen, { ...cmd.opts(), name });
    });
  }

  await program.parseAsync(argv);
}
