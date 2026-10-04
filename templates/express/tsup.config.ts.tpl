import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['{{srcDir}}/main.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  // node_modules se resuelve en runtime: empaquetar dependencias CJS en ESM rompe sus require()
  skipNodeModulesBundle: true,
});
