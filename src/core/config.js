import { join } from 'node:path';
import { readJson, writeFile } from './fs.js';
import { log } from './logger.js';

export const CONFIG_FILE = 'jg.config.json';

const DEFAULT_CONFIG = {
  srcDir: 'src',
  // '' para imports sin extensión (CommonJS/bundlers), '.js' para "module": "NodeNext"
  importExtension: '',
  packageManager: null,
};

export function loadConfig(cwd) {
  return { ...DEFAULT_CONFIG, ...readJson(join(cwd, CONFIG_FILE)) };
}

export function initConfig(cwd, { force } = {}) {
  const status = writeFile(join(cwd, CONFIG_FILE), `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, {
    force,
  });
  log.status(status, CONFIG_FILE);
}
