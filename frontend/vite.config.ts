import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// En desarrollo, las llamadas a /api se redirigen al backend para evitar CORS.
const apiProxy = { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000' };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // material-color-utilities publica imports ESM sin extensión que Node no resuelve;
    // se procesa con Vite igual que en el navegador.
    server: { deps: { inline: ['@material/material-color-utilities'] } },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
      reporter: [['text', { skipFull: false }], 'html', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
});
