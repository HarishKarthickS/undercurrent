import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '#api': fileURLToPath(new URL('./apps/api/src', import.meta.url)),
      '#web': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
      '#tests': fileURLToPath(new URL('./tests', import.meta.url))
    }
  },
  test: {
    include: ['tests/{unit,component,integration,architecture}/**/*.test.{js,jsx}'],
    fileParallelism: false,
    pool: 'threads',
    environmentMatchGlobs: [['tests/component/**', 'jsdom']],
    coverage: {
      provider: 'v8',
      exclude: ['apps/api/src/bootstrap/startServer.js', 'apps/web/src/app/main.jsx'],
      thresholds: { perFile: false, lines: 75, functions: 75, branches: 75, statements: 75 }
    }
  }
});
