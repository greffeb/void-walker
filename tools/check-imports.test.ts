import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkImports, collectImports } from './check-imports';
import { REPO_ROOT } from './repo-files';

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'void-walker-imports-'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    const fullPath = join(root, path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, text);
  }
}

function violations(files: Record<string, string>): string[] {
  write(files);
  return checkImports(root).violations.map((violation) => `${violation.file}:${violation.line} ${violation.message}`);
}

describe('collectImports', () => {
  it('relève chaque forme avec sa ligne et son caractère type seul', () => {
    const source = [
      '/// <reference types="n" />',
      "import { a } from './a';",
      "import type { B } from './b';",
      "import { type C, type D } from './c';",
      "import { type E, f } from './e';",
      "export * from './g';",
      "export type { H } from './h';",
      "const i = await import('./i');",
      "const j = require('./j');",
      "type K = import('./k').K;",
      "import l = require('./l');",
      "import './m';",
    ].join('\n');
    expect(collectImports('x.ts', source)).toEqual([
      { form: '/// <reference types>', specifier: 'n', typeOnly: true, line: 1 },
      { form: 'import', specifier: './a', typeOnly: false, line: 2 },
      { form: 'import', specifier: './b', typeOnly: true, line: 3 },
      { form: 'import', specifier: './c', typeOnly: true, line: 4 },
      { form: 'import', specifier: './e', typeOnly: false, line: 5 },
      { form: 'export … from', specifier: './g', typeOnly: false, line: 6 },
      { form: 'export … from', specifier: './h', typeOnly: true, line: 7 },
      { form: 'import()', specifier: './i', typeOnly: false, line: 8 },
      { form: 'require()', specifier: './j', typeOnly: false, line: 9 },
      { form: 'import() de type', specifier: './k', typeOnly: true, line: 10 },
      { form: 'import = require', specifier: './l', typeOnly: false, line: 11 },
      { form: 'import', specifier: './m', typeOnly: false, line: 12 },
    ]);
  });
});

describe('checkImports', () => {
  it('refuse engine → content', () => {
    expect(
      violations({
        'engine/rules.ts': "export const x = 1;\nimport '../content/index';\n",
        'content/index.ts': 'export {};\n',
      }),
    ).toEqual(["engine/rules.ts:2 import '../content/index' : content/ interdit ; engine/ n'importe que engine/"]);
  });

  it('refuse engine → paquet npm', () => {
    expect(violations({ 'engine/rules.ts': "import { z } from 'zod';\n" })).toEqual([
      "engine/rules.ts:1 import 'zod' : paquet npm interdit ; engine/ n'importe que engine/",
    ]);
  });

  it('refuse engine → module Node, avec ou sans préfixe node:', () => {
    expect(
      violations({ 'engine/rules.ts': "import { readFileSync } from 'node:fs';\nimport path from 'path';\n" }),
    ).toEqual([
      "engine/rules.ts:1 import 'node:fs' : module Node interdit ; engine/ n'importe que engine/",
      "engine/rules.ts:2 import 'path' : module Node interdit ; engine/ n'importe que engine/",
    ]);
  });

  it('accepte les imports relatifs internes à engine/', () => {
    expect(
      violations({ 'engine/a/rules.ts': "import { b } from '../b';\n", 'engine/b.ts': 'export const b = 1;\n' }),
    ).toEqual([]);
  });

  it('refuse content → engine en import de valeur', () => {
    expect(
      violations({
        'content/world.ts': [
          "import { createState } from '../engine/state';",
          "import { type State, step } from '../engine/state';",
          "export * from '../engine/state';",
        ].join('\n'),
      }),
    ).toEqual([
      "content/world.ts:1 import '../engine/state' : import de valeur depuis engine/ (seuls les types : import type) ; content/ n'importe que content/ et les types de engine/",
      "content/world.ts:2 import '../engine/state' : import de valeur depuis engine/ (seuls les types : import type) ; content/ n'importe que content/ et les types de engine/",
      "content/world.ts:3 export … from '../engine/state' : import de valeur depuis engine/ (seuls les types : import type) ; content/ n'importe que content/ et les types de engine/",
    ]);
  });

  it('accepte content → engine en import de types', () => {
    expect(
      violations({
        'content/world.ts': [
          "import type { State } from '../engine/state';",
          "import { type Action, type Room } from '../engine/state';",
          "export type { State } from '../engine/state';",
          "type Step = import('../engine/state').Step;",
        ].join('\n'),
      }),
    ).toEqual([]);
  });

  it('refuse content → paquet npm', () => {
    expect(violations({ 'content/world.ts': "import type { X } from 'zod';\n" })).toEqual([
      "content/world.ts:1 import 'zod' : paquet npm interdit ; content/ n'importe que content/ et les types de engine/",
    ]);
  });

  it('refuse app → cli et app → module Node', () => {
    expect(violations({ 'app/main.ts': "import '../cli/index';\nimport 'node:fs';\nimport 'react';\n" })).toEqual([
      "app/main.ts:1 import '../cli/index' : cli/ interdit ; app/ importe app/, engine/, content/ et des paquets npm",
      "app/main.ts:2 import 'node:fs' : module Node interdit ; app/ importe app/, engine/, content/ et des paquets npm",
    ]);
  });

  it('refuse cli → app et cli → tools', () => {
    expect(violations({ 'cli/main.ts': "import '../app/index';\nimport '../tools/verify';\n" })).toEqual([
      "cli/main.ts:1 import '../app/index' : app/ interdit ; cli/ importe cli/, engine/, content/, des paquets npm et des modules Node",
      "cli/main.ts:2 import '../tools/verify' : tools/ interdit ; cli/ importe cli/, engine/, content/, des paquets npm et des modules Node",
    ]);
  });

  it('accepte tools → app, engine, content, paquets et modules Node', () => {
    expect(
      violations({
        'tools/capture.ts': [
          "import '../app/index';",
          "import '../engine/index';",
          "import '../content/index';",
          "import 'typescript';",
          "import 'node:fs';",
        ].join('\n'),
      }),
    ).toEqual([]);
  });

  it('détecte un import dynamique, un require et un spécifieur non littéral fautifs', () => {
    expect(
      violations({
        'engine/rules.ts': [
          "export const load = () => import('../app/screen');",
          "const fs = require('fs');",
          'export const any = (name: string) => import(name);',
        ].join('\n'),
      }),
    ).toEqual([
      "engine/rules.ts:1 import() '../app/screen' : app/ interdit ; engine/ n'importe que engine/",
      "engine/rules.ts:2 require() 'fs' : module Node interdit ; engine/ n'importe que engine/",
      "engine/rules.ts:3 import() : spécifieur non littéral, impossible à vérifier ; engine/ n'importe que engine/",
    ]);
  });

  it('refuse une cible hors des dossiers du code et une référence /// vers un paquet dans engine/', () => {
    expect(
      violations({ 'engine/rules.ts': "/// <reference types=\"node\" />\nimport '../docs/notes';\n" }),
    ).toEqual([
      "engine/rules.ts:1 /// <reference types> 'node' : paquet npm interdit ; engine/ n'importe que engine/",
      "engine/rules.ts:2 import '../docs/notes' : cible hors des dossiers du code (docs/notes) ; engine/ n'importe que engine/",
    ]);
  });

  it('signale un fichier de code hors des dossiers, sauf configuration racine et node_modules', () => {
    expect(
      violations({
        'scripts/tool.ts': 'export {};\n',
        'helper.ts': 'export {};\n',
        'vitest.config.ts': "import 'vitest/config';\n",
        'eslint.config.js': "import 'eslint';\n",
        'node_modules/pkg/index.ts': "import 'node:fs';\n",
        'dist/bundle.js': "import 'node:fs';\n",
      }),
    ).toEqual([
      'helper.ts:1 fichier hors de engine/, content/, app/, cli/, tools/',
      'scripts/tool.ts:1 fichier hors de engine/, content/, app/, cli/, tools/',
    ]);
  });

  it('analyse aussi .mts, .js et les sous-dossiers nommés comme une sortie générée', () => {
    expect(
      violations({
        'engine/b.mts': "import 'react';\n",
        'engine/c.js': "import '../content/index.js';\n",
        'engine/dist/d.ts': "import 'node:fs';\n",
        'app/dist/bundle.ts': "import '../../cli/index';\n",
      }),
    ).toEqual([
      "app/dist/bundle.ts:1 import '../../cli/index' : cli/ interdit ; app/ importe app/, engine/, content/ et des paquets npm",
      "engine/b.mts:1 import 'react' : paquet npm interdit ; engine/ n'importe que engine/",
      "engine/c.js:1 import '../content/index.js' : content/ interdit ; engine/ n'importe que engine/",
      "engine/dist/d.ts:1 import 'node:fs' : module Node interdit ; engine/ n'importe que engine/",
    ]);
  });

  it('applique aux tests les règles de leur dossier', () => {
    expect(violations({ 'engine/rules.test.ts': "import { describe } from 'vitest';\n" })).toEqual([
      "engine/rules.test.ts:1 import 'vitest' : paquet npm interdit ; engine/ n'importe que engine/",
    ]);
  });

  it('bout en bout : le script sort en erreur sur une violation et en succès sinon', { timeout: 30_000 }, () => {
    const script = fileURLToPath(new URL('./check-imports.ts', import.meta.url));
    const run = () => spawnSync(process.execPath, ['--import', 'tsx', script, root], { cwd: REPO_ROOT, encoding: 'utf8' });

    write({ 'engine/index.ts': 'export {};\n', 'content/index.ts': "import type { State } from '../engine/index';\n" });
    const clean = run();
    expect(clean.status).toBe(0);
    expect(clean.stdout).toContain("Règles d'import respectées : 2 fichiers analysés.");

    write({ 'engine/index.ts': "import '../content/index';\n" });
    const broken = run();
    expect(broken.status).toBe(1);
    expect(broken.stderr).toContain("engine/index.ts:1 import '../content/index' : content/ interdit");
    expect(broken.stderr).toContain("1 violation(s) des règles d'import");
  });
});
