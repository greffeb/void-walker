import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/dist/',
    'coverage/',
    'test-results/',
    'playwright-report/',
    'captures/',
    '.void-walker/',
    '.worktrees/',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['app/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Hasard global interdit (AP-02) : utiliser le générateur à graine de la partie.',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  {
    files: ['engine/**/*.{ts,tsx,mts,cts,js,mjs,cjs}', 'content/**/*.{ts,tsx,mts,cts,js,mjs,cjs}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'Horloge interdite dans engine/ et content/ : le moteur est déterministe.' },
        { name: 'performance', message: 'Horloge interdite dans engine/ et content/ : le moteur est déterministe.' },
      ],
      '@typescript-eslint/triple-slash-reference': ['error', { lib: 'never', path: 'never', types: 'never' }],
    },
  },
);
