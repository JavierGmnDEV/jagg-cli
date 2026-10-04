import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['{{srcDir}}/main.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
});
