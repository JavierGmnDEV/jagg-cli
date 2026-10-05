import { existsSync, readFileSync } from 'node:fs';
import { basename, join, posix } from 'node:path';
import { loadConfig } from './config.js';
import { addComposeService } from './compose.js';
import { addEnvVars } from './env.js';
import { readJson } from './fs.js';
import { pushHistory } from './history.js';
import { log } from './logger.js';
import { buildNames } from './names.js';
import { detectPackageManager, installPackages } from './packages.js';
import { addScripts, setFields } from './scripts.js';
import { render, renderTemplate } from './template.js';
import { createTracker } from './tracker.js';

function projectName(cwd) {
  const name = readJson(join(cwd, 'package.json'))?.name ?? basename(cwd);
  return name.replace(/^@[^/]+\//, '').replace(/[^a-zA-Z0-9_.-]/g, '-');
}

function importPath(from, to, ext) {
  const rel = posix.relative(posix.dirname(from), to.replace(/\.ts$/, ''));
  return `${rel.startsWith('.') ? rel : `./${rel}`}${ext}`;
}

function detectFeatures(cwd, srcDir) {
  const has = (path) => existsSync(join(cwd, srcDir, path));
  return {
    env: has('infrastructure/env/env.provider.ts'),
    clean: has('domain/api') && has('infrastructure/api'),
    redis: has('infrastructure/redis/redis.client.ts'),
    redisLegacy: has('domain/redis/cache.port.ts'),
    postgres: has('infrastructure/data/postgres/postgres.client.ts'),
    prisma: has('infrastructure/data/prisma/schema.prisma'),
    drizzle: has('infrastructure/data/drizzle/schema/index.ts'),
    typeorm: has('infrastructure/data/typeorm/typeorm.client.ts'),
    sequelize: has('infrastructure/data/sequelize/sequelize.client.ts'),
    mongoose: has('infrastructure/data/mongoose/mongoose.client.ts'),
    cacheService: has('domain/api/services/cache.service.ts') && has('infrastructure/api/services/cache.provider.ts'),
    express: has('presentation/http/routes/index.ts'),
  };
}

function appendTo(cwd, append, ctx, tracker) {
  const target = render(append.to, ctx);
  const abs = join(cwd, target);
  const vars = fileVars(append, target, ctx);
  const current = existsSync(abs) ? readFileSync(abs, 'utf8') : '';
  if (current.includes(render(append.marker, vars))) return { target, status: 'skipped' };

  const content = renderTemplate(append.template, vars);
  if (append.position === 'imports') {
    const lines = current.split('\n');
    const lastImport = lines.findLastIndex((line) => /^import\s.*;\s*$/.test(line));
    lines.splice(lastImport + 1, 0, content.replace(/\n$/, ''));
    tracker.write(abs, lines.join('\n'));
  } else {
    const separator = current === '' || current.endsWith('\n') ? '' : '\n';
    tracker.write(abs, `${current}${separator}${content}`);
  }
  return { target, status: 'updated' };
}

function fileVars(file, target, ctx) {
  const imports = Object.fromEntries(
    Object.entries(file.imports ?? {}).map(([key, path]) => [key, importPath(target, render(path, ctx), ctx.ext)]),
  );
  return { ...ctx, ...file.vars, ...imports };
}

export async function runGenerator(gen, opts) {
  const cwd = process.cwd();
  const config = loadConfig(cwd);
  const srcDir = opts.src ?? config.srcDir;

  const ctx = {
    ...buildNames(opts.name ?? gen.name),
    srcDir,
    ext: config.importExtension,
    project: projectName(cwd),
    features: detectFeatures(cwd, srcDir),
    options: opts,
  };
  ctx.read = (path) => {
    const abs = join(cwd, render(path, ctx));
    return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  };
  const plan = gen.plan(ctx);
  const tracker = createTracker(cwd, opts);
  const command = [
    'generate',
    gen.name,
    opts.name,
    ...(gen.options ?? []).map(([flags]) => {
      const flag = flags.match(/--([\w-]+)/)[1];
      const value = opts[flag.replace(/-(\w)/g, (_, c) => c.toUpperCase())];
      return value === undefined ? undefined : `--${flag} ${value}`;
    }),
  ]
    .filter(Boolean)
    .join(' ');
  const state = { installed: [], scripts: {}, fields: {}, pm: undefined };

  log.title(`jg ${command}${opts.dryRun ? ' (dry-run)' : ''}`);

  try {
    applyPlan({ cwd, gen, plan, ctx, opts, config, tracker, state });
  } finally {
    // También si falló a mitad de camino: lo que sí se escribió debe poder deshacerse
    const hasChanges =
      tracker.files.length > 0 ||
      state.installed.length > 0 ||
      Object.keys(state.scripts).length > 0 ||
      Object.keys(state.fields).length > 0;
    if (!opts.dryRun && hasChanges) {
      pushHistory(cwd, {
        command,
        date: new Date().toISOString(),
        files: tracker.files,
        dirs: tracker.dirs,
        packages: state.installed,
        scripts: state.scripts,
        fields: state.fields,
        pm: state.pm,
      });
    }
  }

  for (const note of plan.notes ?? []) log.info(`\n${render(note, ctx)}`);
  log.success('Listo');
}

function applyPlan({ cwd, gen, plan, ctx, opts, config, tracker, state }) {
  for (const file of plan.files ?? []) {
    const target = render(file.to, ctx);
    const abs = join(cwd, target);
    const exists = existsSync(abs);
    if (exists && !opts.force && !file.overwrite) {
      log.status('skipped', target);
      continue;
    }
    const content = file.content ?? renderTemplate(file.template, fileVars(file, target, ctx));
    if (exists && readFileSync(abs, 'utf8') === content) {
      log.status('identical', target);
      continue;
    }
    tracker.write(abs, content);
    log.status(exists ? 'overwritten' : 'created', target);
  }

  for (const append of plan.appends ?? []) {
    const { target, status } = appendTo(cwd, append, ctx, tracker);
    log.status(status, target);
  }

  if (plan.env) {
    for (const [file, status] of addEnvVars(cwd, gen.name, plan.env, tracker.write)) {
      log.status(status, file);
    }
  }

  if (plan.compose && !opts.skipDocker) {
    const { fileName, status } = addComposeService(cwd, plan.compose, opts, tracker.write);
    log.status(status, `${fileName} → services.${plan.compose.name}`);
  }

  if ((plan.dependencies?.length || plan.devDependencies?.length) && !opts.skipInstall) {
    state.pm = detectPackageManager(cwd, config.packageManager);
    const result = installPackages(cwd, plan, { pm: state.pm, dryRun: opts.dryRun });
    state.installed = result.installed;
    for (const cmd of result.commands) log.status(opts.dryRun ? 'skipped' : 'updated', cmd.join(' '));
    if (result.error) log.warn(result.error);
  }

  if (plan.scripts || plan.packageJson) {
    if (!existsSync(join(cwd, 'package.json'))) {
      log.warn('No hay package.json: no se actualizaron scripts ni campos');
      return;
    }
    if (plan.packageJson) {
      state.fields = setFields(cwd, plan.packageJson, opts);
      for (const key of Object.keys(plan.packageJson)) {
        log.status(key in state.fields ? 'updated' : 'skipped', `package.json → ${key}`);
      }
    }
    if (plan.scripts) {
      const scripts = Object.fromEntries(Object.entries(plan.scripts).map(([k, v]) => [k, render(v, ctx)]));
      state.scripts = addScripts(cwd, scripts, opts);
      for (const name of Object.keys(scripts)) {
        log.status(name in state.scripts ? 'updated' : 'skipped', `package.json → scripts.${name}`);
      }
    }
  }
}
