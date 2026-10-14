// Vitest configuration — runs tests from the /tests directory.
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
    server: {
      deps: {
        external: ['node:sqlite', 'sqlite'],
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@server': path.resolve(__dirname, 'server/src'),
    },
  },
});
