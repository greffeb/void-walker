import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Globales : les tests de engine/ et content/ n'ont pas le droit d'importer un paquet npm.
    globals: true,
    include: ['{engine,content,app,cli,tools,report-service}/**/*.test.{ts,tsx}'],
  },
});
