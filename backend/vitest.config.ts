import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Punto de entrada: solo compone dependencias y abre el puerto.
      exclude: ['src/server.ts'],
      reporter: [['text', { skipFull: false }], 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: { lines: 85, branches: 85, functions: 85, statements: 85 },
    },
  },
});
