import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('.', import.meta.url));
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001';

export default defineConfig({
  root: webRoot,
  resolve: { alias: { '#web': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        rewrite: (path) => path.replace(/^\/api/, ''),
        timeout: 90_000,
        proxyTimeout: 90_000
      }
    }
  },
  build: { outDir: 'dist', emptyOutDir: true }
});
