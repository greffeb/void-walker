import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

const resolve = (p: string): string =>
  fileURLToPath(new URL(p, import.meta.url));

// Vitest projects do not inherit the root `resolve`, so every project declares
// it. Without this, a runtime `@alias` import anywhere under src/ fails the
// moment a test loads that file — and only type-only alias imports survived.
const alias = {
  '@engine': resolve('./src/engine'),
  '@content': resolve('./src/content'),
  '@i18n': resolve('./src/i18n'),
  '@narration': resolve('./src/narration'),
  '@ai': resolve('./src/ai'),
  '@ui': resolve('./src/ui'),
  '@stores': resolve('./src/stores'),
  '@services': resolve('./src/services'),
};

export default defineConfig({
  resolve: { alias },
  test: {
    reporters: ['verbose'],
    typecheck: { enabled: true },
    coverage: {
      provider: 'v8',
      include: ['src/engine/**', 'src/narration/**', 'src/content/**'],
      reporter: ['text', 'text-summary'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'stress',
          include: ['tests/stress/**/*.test.ts'],
          testTimeout: 120_000,
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          testTimeout: 30_000,
        },
      },
    ],
  },
});
